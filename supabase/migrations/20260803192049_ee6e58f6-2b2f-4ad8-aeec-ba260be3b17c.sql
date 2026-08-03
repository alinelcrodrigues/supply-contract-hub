-- ============ FAIXAS DE ALÇADA (medição) ============
CREATE TABLE public.measurement_approval_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_value numeric NOT NULL DEFAULT 0,
  max_value numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurement_approval_tiers TO authenticated;
GRANT ALL ON public.measurement_approval_tiers TO service_role;
ALTER TABLE public.measurement_approval_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY mat_read ON public.measurement_approval_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY mat_admin_write ON public.measurement_approval_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mat_set_updated_at BEFORE UPDATE ON public.measurement_approval_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.measurement_approval_tier_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL REFERENCES public.measurement_approval_tiers(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tier_id, step_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurement_approval_tier_steps TO authenticated;
GRANT ALL ON public.measurement_approval_tier_steps TO service_role;
ALTER TABLE public.measurement_approval_tier_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY mats_read ON public.measurement_approval_tier_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY mats_admin_write ON public.measurement_approval_tier_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ MEDIÇÃO ============
CREATE TABLE public.contract_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'rascunho',
  tier_id uuid REFERENCES public.measurement_approval_tiers(id),
  current_step integer NOT NULL DEFAULT 0,
  reference_month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  total_value numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_measurements TO authenticated;
GRANT ALL ON public.contract_measurements TO service_role;
ALTER TABLE public.contract_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_read ON public.contract_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY cm_insert ON public.contract_measurements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.can_manage_contracts(auth.uid()));
CREATE POLICY cm_update ON public.contract_measurements FOR UPDATE TO authenticated
  USING ((created_by = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK ((created_by = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY cm_delete ON public.contract_measurements FOR DELETE TO authenticated
  USING ((created_by = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER cm_set_updated_at BEFORE UPDATE ON public.contract_measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contract_measurement_cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES public.contract_measurements(id) ON DELETE CASCADE,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_measurement_cost_centers TO authenticated;
GRANT ALL ON public.contract_measurement_cost_centers TO service_role;
ALTER TABLE public.contract_measurement_cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cmcc_read ON public.contract_measurement_cost_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY cmcc_write ON public.contract_measurement_cost_centers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contract_measurements m WHERE m.id = measurement_id AND (m.created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contract_measurements m WHERE m.id = measurement_id AND (m.created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.contract_measurement_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES public.contract_measurements(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_id uuid NOT NULL REFERENCES public.profiles(id),
  decision text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contract_measurement_approvals TO authenticated;
GRANT ALL ON public.contract_measurement_approvals TO service_role;
ALTER TABLE public.contract_measurement_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY cma_read ON public.contract_measurement_approvals FOR SELECT TO authenticated USING (true);

-- ============ FINANCEIRO ============
CREATE TABLE public.financial_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL UNIQUE REFERENCES public.contract_measurements(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aguardando_documento',
  due_date date,
  paid_at timestamptz,
  paid_by uuid REFERENCES public.profiles(id),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_movements TO authenticated;
GRANT ALL ON public.financial_movements TO service_role;
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY fm_read ON public.financial_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY fm_write ON public.financial_movements FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid())) WITH CHECK (public.can_manage_contracts(auth.uid()));
CREATE TRIGGER fm_set_updated_at BEFORE UPDATE ON public.financial_movements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.billing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES public.financial_movements(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'nota_fiscal',
  doc_number text NOT NULL DEFAULT '',
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_documents TO authenticated;
GRANT ALL ON public.billing_documents TO service_role;
ALTER TABLE public.billing_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY bd_read ON public.billing_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY bd_write ON public.billing_documents FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid())) WITH CHECK (public.can_manage_contracts(auth.uid()));

-- ao anexar documento, movimento passa para aguardando pagamento
CREATE OR REPLACE FUNCTION public.fn_billing_document_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.financial_movements
    SET status = 'aguardando_pagamento'
    WHERE id = NEW.movement_id AND status = 'aguardando_documento';
  RETURN NEW;
END; $$;
CREATE TRIGGER billing_document_added AFTER INSERT ON public.billing_documents
  FOR EACH ROW EXECUTE FUNCTION public.fn_billing_document_added();

-- ============ FUNÇÕES DE FLUXO ============
CREATE OR REPLACE FUNCTION public.fn_find_measurement_tier(_value numeric)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.measurement_approval_tiers
  WHERE active AND _value >= min_value AND (max_value IS NULL OR _value <= max_value)
  ORDER BY min_value DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_submit_measurement(_measurement_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.contract_measurements; t uuid; n int;
BEGIN
  SELECT * INTO m FROM public.contract_measurements WHERE id = _measurement_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Medição não encontrada'; END IF;
  IF m.created_by <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Sem permissão para enviar esta medição'; END IF;
  IF m.status NOT IN ('rascunho','reprovada') THEN RAISE EXCEPTION 'Medição já está em aprovação'; END IF;
  t := public.fn_find_measurement_tier(m.total_value);
  IF t IS NULL THEN RAISE EXCEPTION 'Nenhuma faixa de alçada de medição configurada para este valor'; END IF;
  SELECT count(*) INTO n FROM public.measurement_approval_tier_steps WHERE tier_id = t;
  IF n = 0 THEN RAISE EXCEPTION 'A faixa de alçada não possui aprovadores configurados'; END IF;
  DELETE FROM public.contract_measurement_approvals WHERE measurement_id = _measurement_id;
  UPDATE public.contract_measurements
    SET tier_id = t, current_step = 1, status = 'em_aprovacao', rejection_reason = NULL
    WHERE id = _measurement_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_decide_measurement(_measurement_id uuid, _approve boolean, _comment text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.contract_measurements; expected uuid; total int;
BEGIN
  SELECT * INTO m FROM public.contract_measurements WHERE id = _measurement_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Medição não encontrada'; END IF;
  IF m.status <> 'em_aprovacao' THEN RAISE EXCEPTION 'Medição não está em aprovação'; END IF;
  SELECT approver_id INTO expected FROM public.measurement_approval_tier_steps
    WHERE tier_id = m.tier_id AND step_order = m.current_step;
  IF expected IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Não é a sua vez de aprovar'; END IF;

  INSERT INTO public.contract_measurement_approvals (measurement_id, step_order, approver_id, decision, comment)
  VALUES (_measurement_id, m.current_step, auth.uid(), CASE WHEN _approve THEN 'aprovado' ELSE 'reprovado' END, _comment);

  IF NOT _approve THEN
    UPDATE public.contract_measurements SET status = 'reprovada', current_step = 0, rejection_reason = _comment
      WHERE id = _measurement_id;
    RETURN;
  END IF;

  SELECT count(*) INTO total FROM public.measurement_approval_tier_steps WHERE tier_id = m.tier_id;
  IF m.current_step >= total THEN
    UPDATE public.contract_measurements SET status = 'aprovada', current_step = 0 WHERE id = _measurement_id;
    INSERT INTO public.financial_movements (measurement_id, contract_id, amount, status, notes)
    VALUES (_measurement_id, m.contract_id, m.total_value, 'aguardando_documento', m.notes)
    ON CONFLICT (measurement_id) DO NOTHING;
  ELSE
    UPDATE public.contract_measurements SET current_step = m.current_step + 1 WHERE id = _measurement_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_mark_movement_paid(_movement_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mv public.financial_movements;
BEGIN
  IF NOT public.can_manage_contracts(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO mv FROM public.financial_movements WHERE id = _movement_id;
  IF mv IS NULL THEN RAISE EXCEPTION 'Movimento não encontrado'; END IF;
  IF mv.status = 'aguardando_documento' THEN
    RAISE EXCEPTION 'Anexe o documento de cobrança antes de marcar como pago'; END IF;
  UPDATE public.financial_movements
    SET status = 'pago', paid_at = now(), paid_by = auth.uid() WHERE id = _movement_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.fn_find_measurement_tier(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_measurement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_decide_measurement(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_mark_movement_paid(uuid) TO authenticated;

-- Endurecimento: nenhuma dessas funções deve ser chamável sem login
REVOKE EXECUTE ON FUNCTION public.fn_find_approval_tier(numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_submit_contract_request(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_decide_contract_request(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_convert_request_to_contract(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_find_measurement_tier(numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_submit_measurement(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_decide_measurement(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_mark_movement_paid(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fn_find_approval_tier(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_contract_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_decide_contract_request(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_convert_request_to_contract(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_find_measurement_tier(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_measurement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_decide_measurement(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_mark_movement_paid(uuid) TO authenticated;