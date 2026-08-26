
-- ============ PLACAS ============
CREATE TABLE public.carreteiro_plates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  driver_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada')),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_plates TO authenticated;
GRANT ALL ON public.carreteiro_plates TO service_role;
ALTER TABLE public.carreteiro_plates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plates_select" ON public.carreteiro_plates FOR SELECT TO authenticated USING (true);
CREATE POLICY "plates_insert" ON public.carreteiro_plates FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "plates_update" ON public.carreteiro_plates FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));
CREATE POLICY "plates_delete" ON public.carreteiro_plates FOR DELETE TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'));
CREATE TRIGGER carreteiro_plates_set_updated_at BEFORE UPDATE ON public.carreteiro_plates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONTRATOS DE CARRETEIRO ============
CREATE TABLE public.carreteiro_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  carrier_name text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id),
  pricing_mode text NOT NULL DEFAULT 'km_tonelada' CHECK (pricing_mode IN ('km','tonelada','km_tonelada')),
  unit_price numeric NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  financial_category text NOT NULL DEFAULT '',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  contract_id uuid REFERENCES public.contracts(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_contracts TO authenticated;
GRANT ALL ON public.carreteiro_contracts TO service_role;
ALTER TABLE public.carreteiro_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_select" ON public.carreteiro_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "cc_write" ON public.carreteiro_contracts FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));
CREATE TRIGGER carreteiro_contracts_set_updated_at BEFORE UPDATE ON public.carreteiro_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VINCULO PLACA x CONTRATO ============
CREATE TABLE public.carreteiro_plate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id uuid NOT NULL REFERENCES public.carreteiro_plates(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.carreteiro_contracts(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE UNIQUE INDEX carreteiro_plate_links_open_uniq ON public.carreteiro_plate_links (plate_id) WHERE end_date IS NULL;
CREATE INDEX carreteiro_plate_links_contract_idx ON public.carreteiro_plate_links (contract_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_plate_links TO authenticated;
GRANT ALL ON public.carreteiro_plate_links TO service_role;
ALTER TABLE public.carreteiro_plate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpl_select" ON public.carreteiro_plate_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "cpl_write" ON public.carreteiro_plate_links FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));
CREATE TRIGGER carreteiro_plate_links_set_updated_at BEFORE UPDATE ON public.carreteiro_plate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CARGAS ============
CREATE TABLE public.carreteiro_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.carreteiro_contracts(id) ON DELETE CASCADE,
  plate_id uuid NOT NULL REFERENCES public.carreteiro_plates(id),
  load_date date NOT NULL DEFAULT CURRENT_DATE,
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  km numeric NOT NULL DEFAULT 0,
  tons numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  pricing_mode text NOT NULL DEFAULT 'km_tonelada' CHECK (pricing_mode IN ('km','tonelada','km_tonelada')),
  total_value numeric NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  financial_category text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  closing_id uuid,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carreteiro_loads_contract_date_idx ON public.carreteiro_loads (contract_id, load_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_loads TO authenticated;
GRANT ALL ON public.carreteiro_loads TO service_role;
ALTER TABLE public.carreteiro_loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl_select" ON public.carreteiro_loads FOR SELECT TO authenticated USING (true);
CREATE POLICY "cl_write" ON public.carreteiro_loads FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));

CREATE OR REPLACE FUNCTION public.fn_carreteiro_load_total()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.total_value := CASE NEW.pricing_mode
    WHEN 'km' THEN COALESCE(NEW.km,0) * COALESCE(NEW.unit_price,0)
    WHEN 'tonelada' THEN COALESCE(NEW.tons,0) * COALESCE(NEW.unit_price,0)
    ELSE COALESCE(NEW.km,0) * COALESCE(NEW.tons,0) * COALESCE(NEW.unit_price,0)
  END;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER carreteiro_loads_total BEFORE INSERT OR UPDATE ON public.carreteiro_loads
  FOR EACH ROW EXECUTE FUNCTION public.fn_carreteiro_load_total();

-- ============ COMBUSTIVEL ============
CREATE TABLE public.carreteiro_fuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id uuid NOT NULL REFERENCES public.carreteiro_plates(id),
  contract_id uuid REFERENCES public.carreteiro_contracts(id) ON DELETE SET NULL,
  fuel_date date NOT NULL DEFAULT CURRENT_DATE,
  liters numeric NOT NULL DEFAULT 0,
  price_per_liter numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  notes text NOT NULL DEFAULT '',
  closing_id uuid,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carreteiro_fuel_date_idx ON public.carreteiro_fuel (plate_id, fuel_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_fuel TO authenticated;
GRANT ALL ON public.carreteiro_fuel TO service_role;
ALTER TABLE public.carreteiro_fuel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_select" ON public.carreteiro_fuel FOR SELECT TO authenticated USING (true);
CREATE POLICY "cf_write" ON public.carreteiro_fuel FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));

CREATE OR REPLACE FUNCTION public.fn_carreteiro_fuel_total()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.total_value := COALESCE(NEW.liters,0) * COALESCE(NEW.price_per_liter,0);
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER carreteiro_fuel_total BEFORE INSERT OR UPDATE ON public.carreteiro_fuel
  FOR EACH ROW EXECUTE FUNCTION public.fn_carreteiro_fuel_total();

-- ============ FECHAMENTO MENSAL ============
CREATE TABLE public.carreteiro_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.carreteiro_contracts(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  loads_total numeric NOT NULL DEFAULT 0,
  fuel_total numeric NOT NULL DEFAULT 0,
  net_total numeric NOT NULL DEFAULT 0,
  measurement_id uuid REFERENCES public.contract_measurements(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carreteiro_closings TO authenticated;
GRANT ALL ON public.carreteiro_closings TO service_role;
ALTER TABLE public.carreteiro_closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cclose_select" ON public.carreteiro_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "cclose_write" ON public.carreteiro_closings FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'carreteiros.manage'))
  WITH CHECK (public.has_permission(auth.uid(),'carreteiros.manage'));
CREATE TRIGGER carreteiro_closings_set_updated_at BEFORE UPDATE ON public.carreteiro_closings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.carreteiro_loads ADD CONSTRAINT carreteiro_loads_closing_fk
  FOREIGN KEY (closing_id) REFERENCES public.carreteiro_closings(id) ON DELETE SET NULL;
ALTER TABLE public.carreteiro_fuel ADD CONSTRAINT carreteiro_fuel_closing_fk
  FOREIGN KEY (closing_id) REFERENCES public.carreteiro_closings(id) ON DELETE SET NULL;

-- contrato "espelho" para aproveitar alcada/financeiro de medicao
CREATE OR REPLACE FUNCTION public.fn_ensure_carreteiro_shadow_contract(_cc_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cc public.carreteiro_contracts; new_id uuid;
BEGIN
  SELECT * INTO cc FROM public.carreteiro_contracts WHERE id = _cc_id;
  IF cc IS NULL THEN RAISE EXCEPTION 'Contrato de carreteiro não encontrado'; END IF;
  IF cc.contract_id IS NOT NULL THEN RETURN cc.contract_id; END IF;
  INSERT INTO public.contracts (number, supplier, object, global_value, budget_value,
      start_date, end_date, adjustment_index, adjustment_month, signed,
      cost_center_id, financial_category, created_by)
  VALUES (cc.number, cc.carrier_name, 'Contrato de carreteiro - ' || cc.number, 0, NULL,
      cc.start_date, COALESCE(cc.end_date, cc.start_date + 365), 'Nenhum',
      EXTRACT(MONTH FROM cc.start_date)::int, false,
      cc.cost_center_id, cc.financial_category, cc.created_by)
  RETURNING id INTO new_id;
  UPDATE public.carreteiro_contracts SET contract_id = new_id WHERE id = _cc_id;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_generate_carreteiro_closing(_cc_id uuid, _start date, _end date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cc public.carreteiro_contracts; shadow uuid; loads_t numeric; fuel_t numeric;
        close_id uuid; meas_id uuid;
BEGIN
  IF NOT public.has_permission(auth.uid(),'carreteiros.manage') THEN
    RAISE EXCEPTION 'Sem permissão para gerar fechamento'; END IF;
  SELECT * INTO cc FROM public.carreteiro_contracts WHERE id = _cc_id;
  IF cc IS NULL THEN RAISE EXCEPTION 'Contrato de carreteiro não encontrado'; END IF;

  SELECT COALESCE(sum(total_value),0) INTO loads_t FROM public.carreteiro_loads
    WHERE contract_id = _cc_id AND closing_id IS NULL AND load_date BETWEEN _start AND _end;
  SELECT COALESCE(sum(f.total_value),0) INTO fuel_t FROM public.carreteiro_fuel f
    WHERE f.closing_id IS NULL AND f.fuel_date BETWEEN _start AND _end
      AND (f.contract_id = _cc_id OR EXISTS (
        SELECT 1 FROM public.carreteiro_plate_links l
        WHERE l.plate_id = f.plate_id AND l.contract_id = _cc_id
          AND f.fuel_date >= l.start_date AND (l.end_date IS NULL OR f.fuel_date <= l.end_date)));

  IF loads_t = 0 AND fuel_t = 0 THEN
    RAISE EXCEPTION 'Nenhuma carga ou abastecimento em aberto no período'; END IF;

  shadow := public.fn_ensure_carreteiro_shadow_contract(_cc_id);

  INSERT INTO public.carreteiro_closings (contract_id, period_start, period_end, loads_total, fuel_total, net_total, created_by)
  VALUES (_cc_id, _start, _end, loads_t, fuel_t, loads_t - fuel_t, auth.uid())
  RETURNING id INTO close_id;

  INSERT INTO public.contract_measurements (contract_id, created_by, status, current_step,
      reference_month, total_value, notes)
  VALUES (shadow, auth.uid(), 'rascunho', 0, date_trunc('month', _start)::date, loads_t - fuel_t,
      'Fechamento carreteiro ' || to_char(_start,'DD/MM/YYYY') || ' a ' || to_char(_end,'DD/MM/YYYY') ||
      ' | Cargas: ' || loads_t::text || ' | Combustível: ' || fuel_t::text)
  RETURNING id INTO meas_id;

  IF cc.cost_center_id IS NOT NULL THEN
    INSERT INTO public.contract_measurement_cost_centers (measurement_id, cost_center_id, value)
    VALUES (meas_id, cc.cost_center_id, loads_t - fuel_t);
  END IF;

  UPDATE public.carreteiro_closings SET measurement_id = meas_id WHERE id = close_id;
  UPDATE public.carreteiro_loads SET closing_id = close_id
    WHERE contract_id = _cc_id AND closing_id IS NULL AND load_date BETWEEN _start AND _end;
  UPDATE public.carreteiro_fuel f SET closing_id = close_id
    WHERE f.closing_id IS NULL AND f.fuel_date BETWEEN _start AND _end
      AND (f.contract_id = _cc_id OR EXISTS (
        SELECT 1 FROM public.carreteiro_plate_links l
        WHERE l.plate_id = f.plate_id AND l.contract_id = _cc_id
          AND f.fuel_date >= l.start_date AND (l.end_date IS NULL OR f.fuel_date <= l.end_date)));
  RETURN close_id;
END; $$;
