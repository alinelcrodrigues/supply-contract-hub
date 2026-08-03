-- =========================================================
-- Contratos de suprimentos: schema + rateio por centro de custo
-- =========================================================

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  supplier text NOT NULL,
  object text NOT NULL DEFAULT '',
  global_value numeric(14,2) NOT NULL DEFAULT 0,
  budget_value numeric(14,2),
  start_date date NOT NULL,
  end_date date NOT NULL,
  adjustment_index text NOT NULL DEFAULT 'Nenhum',
  adjustment_month integer NOT NULL DEFAULT 1,
  signed boolean NOT NULL DEFAULT false,
  cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  financial_category text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contract_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  value numeric(14,2) NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  financial_category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contract_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'ajuste_valor',
  description text NOT NULL DEFAULT '',
  value numeric(14,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contract_addendums_tipo_check CHECK (tipo IN ('ajuste_valor','inclusao_item'))
);

CREATE TABLE public.contract_addendum_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addendum_id uuid NOT NULL REFERENCES public.contract_addendums(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  value numeric(14,2) NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  financial_category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  description text NOT NULL DEFAULT '',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  other_expenses numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  observation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contract_items_contract_id_idx ON public.contract_items(contract_id);
CREATE INDEX contract_addendums_contract_id_idx ON public.contract_addendums(contract_id);
CREATE INDEX contract_addendum_items_addendum_id_idx ON public.contract_addendum_items(addendum_id);
CREATE INDEX measurements_contract_id_idx ON public.measurements(contract_id);

-- ---------------- Grants ----------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_items TO authenticated;
GRANT ALL ON public.contract_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_addendums TO authenticated;
GRANT ALL ON public.contract_addendums TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_addendum_items TO authenticated;
GRANT ALL ON public.contract_addendum_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurements TO authenticated;
GRANT ALL ON public.measurements TO service_role;

-- ---------------- RLS ----------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_addendums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_addendum_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_contracts(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'gestor'::app_role)
      OR public.has_role(_user_id, 'financeiro'::app_role)
$$;

CREATE POLICY "contracts_read" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_write" ON public.contracts FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid()))
  WITH CHECK (public.can_manage_contracts(auth.uid()));

CREATE POLICY "contract_items_read" ON public.contract_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_items_write" ON public.contract_items FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid()))
  WITH CHECK (public.can_manage_contracts(auth.uid()));

CREATE POLICY "contract_addendums_read" ON public.contract_addendums FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_addendums_write" ON public.contract_addendums FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid()))
  WITH CHECK (public.can_manage_contracts(auth.uid()));

CREATE POLICY "contract_addendum_items_read" ON public.contract_addendum_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_addendum_items_write" ON public.contract_addendum_items FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid()))
  WITH CHECK (public.can_manage_contracts(auth.uid()));

CREATE POLICY "measurements_read" ON public.measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "measurements_write" ON public.measurements FOR ALL TO authenticated
  USING (public.can_manage_contracts(auth.uid()))
  WITH CHECK (public.can_manage_contracts(auth.uid()));

-- ---------------- updated_at triggers ----------------
CREATE TRIGGER contracts_set_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER contract_items_set_updated_at BEFORE UPDATE ON public.contract_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER contract_addendums_set_updated_at BEFORE UPDATE ON public.contract_addendums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER contract_addendum_items_set_updated_at BEFORE UPDATE ON public.contract_addendum_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER measurements_set_updated_at BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Views de rateio por centro de custo
-- =========================================================

-- 1) Origem de cada parcela de valor
CREATE VIEW public.v_contract_cost_center_sources
WITH (security_invoker = true) AS
  SELECT
    ci.contract_id,
    ci.cost_center_id,
    'contrato'::text AS origin_type,
    NULL::uuid       AS addendum_id,
    NULL::text       AS addendum_description,
    ci.description,
    ci.financial_category,
    ci.value
  FROM public.contract_items ci
  UNION ALL
  SELECT
    a.contract_id,
    ai.cost_center_id,
    'aditivo'::text AS origin_type,
    a.id            AS addendum_id,
    a.description   AS addendum_description,
    ai.description,
    ai.financial_category,
    ai.value
  FROM public.contract_addendum_items ai
  JOIN public.contract_addendums a ON a.id = ai.addendum_id;

-- 2) Alocação por contrato x centro de custo (com rateio proporcional)
CREATE VIEW public.v_contract_cost_center_allocation
WITH (security_invoker = true) AS
  WITH base AS (
    SELECT contract_id, cost_center_id, SUM(value) AS base_value
    FROM public.v_contract_cost_center_sources
    GROUP BY contract_id, cost_center_id
  ),
  totals AS (
    SELECT contract_id, SUM(base_value) AS total_base
    FROM base GROUP BY contract_id
  ),
  adjustments AS (
    SELECT contract_id, COALESCE(SUM(value), 0) AS adjustment_total
    FROM public.contract_addendums
    WHERE tipo = 'ajuste_valor'
    GROUP BY contract_id
  ),
  realized AS (
    SELECT contract_id,
           COALESCE(SUM(amount + COALESCE(other_expenses,0) - COALESCE(discount,0)), 0) AS realized_total
    FROM public.measurements
    GROUP BY contract_id
  )
  SELECT
    b.contract_id,
    c.number   AS contract_number,
    c.supplier AS contract_supplier,
    b.cost_center_id,
    cc.name    AS cost_center_name,
    b.base_value,
    CASE WHEN t.total_base > 0 THEN b.base_value / t.total_base ELSE 0 END AS share,
    ROUND(CASE WHEN t.total_base > 0
               THEN b.base_value / t.total_base * COALESCE(adj.adjustment_total, 0)
               ELSE 0 END, 2) AS adjustment_value,
    ROUND(b.base_value + CASE WHEN t.total_base > 0
               THEN b.base_value / t.total_base * COALESCE(adj.adjustment_total, 0)
               ELSE 0 END, 2) AS contracted_value,
    ROUND(CASE WHEN t.total_base > 0
               THEN b.base_value / t.total_base * COALESCE(r.realized_total, 0)
               ELSE 0 END, 2) AS realized_value
  FROM base b
  JOIN totals t          ON t.contract_id = b.contract_id
  JOIN public.contracts c ON c.id = b.contract_id
  LEFT JOIN public.cost_centers cc ON cc.id = b.cost_center_id
  LEFT JOIN adjustments adj ON adj.contract_id = b.contract_id
  LEFT JOIN realized r      ON r.contract_id = b.contract_id;

-- 3) Resumo consolidado por centro de custo
CREATE VIEW public.v_cost_center_summary
WITH (security_invoker = true) AS
  SELECT
    a.cost_center_id,
    COALESCE(a.cost_center_name, 'Sem centro de custo') AS cost_center_name,
    COUNT(DISTINCT a.contract_id)          AS contract_count,
    SUM(a.contracted_value)                AS contracted_value,
    SUM(a.realized_value)                  AS realized_value,
    SUM(a.contracted_value - a.realized_value) AS balance
  FROM public.v_contract_cost_center_allocation a
  GROUP BY a.cost_center_id, a.cost_center_name;

GRANT SELECT ON public.v_contract_cost_center_sources TO authenticated;
GRANT SELECT ON public.v_contract_cost_center_allocation TO authenticated;
GRANT SELECT ON public.v_cost_center_summary TO authenticated;

-- =========================================================
-- Dados de demonstração
-- =========================================================
WITH cc AS (
  SELECT
    (SELECT id FROM public.cost_centers WHERE code = 'CC-001') AS vila_nova,
    (SELECT id FROM public.cost_centers WHERE code = 'CC-002') AS centro,
    (SELECT id FROM public.cost_centers WHERE code = 'CC-003') AS norte
),
ins AS (
  INSERT INTO public.contracts
    (id, number, supplier, object, global_value, budget_value, start_date, end_date,
     adjustment_index, adjustment_month, signed, cost_center_id, financial_category)
  SELECT * FROM (
    SELECT '11111111-1111-4111-8111-000000000001'::uuid, 'CT-2025-001', 'Cimentos União Ltda.', 'Fornecimento de cimento CP-II', 480000, 450000,
           current_date - 300, current_date + 20, 'INCC', EXTRACT(MONTH FROM current_date)::int, true, (SELECT vila_nova FROM cc), 'Estrutura'
    UNION ALL SELECT '11111111-1111-4111-8111-000000000002', 'CT-2025-014', 'Aço Forte Distribuidora', 'Vergalhões e telas soldadas', 1250000, 1200000,
           current_date - 180, current_date + 200, 'IPCA', EXTRACT(MONTH FROM current_date)::int, true, (SELECT centro FROM cc), 'Estrutura'
    UNION ALL SELECT '11111111-1111-4111-8111-000000000003', 'CT-2025-022', 'Madeireira Pinheiro', 'Madeira para fôrmas', 220000, NULL,
           current_date - 90, current_date + 90, 'Nenhum', 1, false, (SELECT vila_nova FROM cc), 'Alvenaria'
    UNION ALL SELECT '11111111-1111-4111-8111-000000000004', 'CT-2025-031', 'Elétrica Power Sul', 'Material elétrico e quadros', 380000, 380000,
           current_date - 120, current_date + 150, 'IPCA', 6, true, (SELECT centro FROM cc), 'Instalações Elétricas'
    UNION ALL SELECT '11111111-1111-4111-8111-000000000005', 'CT-2025-040', 'Locadora Máquinas Brasil', 'Locação de gruas e betoneiras', 540000, 500000,
           current_date - 60, current_date + 240, 'IGP-M', 9, true, (SELECT norte FROM cc), 'Locação de Equipamentos'
  ) t
  RETURNING 1
)
SELECT 1;

-- Itens do contrato original (espelham o centro de custo/categoria do contrato)
INSERT INTO public.contract_items (contract_id, description, value, cost_center_id, financial_category)
SELECT c.id, c.object, c.global_value, c.cost_center_id, c.financial_category FROM public.contracts c;

-- Medições
INSERT INTO public.measurements (contract_id, date, description, amount)
VALUES
  ('11111111-1111-4111-8111-000000000001', current_date - 60, 'Medição #1', 120000),
  ('11111111-1111-4111-8111-000000000001', current_date - 30, 'Medição #2', 95000),
  ('11111111-1111-4111-8111-000000000002', current_date - 45, 'Medição #1', 320000),
  ('11111111-1111-4111-8111-000000000004', current_date - 50, 'Medição #1', 80000),
  ('11111111-1111-4111-8111-000000000004', current_date - 20, 'Medição #2', 60000),
  ('11111111-1111-4111-8111-000000000005', current_date - 25, 'Medição #1', 90000);

-- Aditivos de demonstração
INSERT INTO public.contract_addendums (id, contract_id, tipo, description, value, date)
VALUES
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000002', 'inclusao_item',
   'Aditivo 01 — fornecimento adicional para Obra Industrial Norte', 180000, current_date - 40),
  ('22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000001', 'ajuste_valor',
   'Aditivo 01 — reajuste INCC', 36000, current_date - 20);

INSERT INTO public.contract_addendum_items (addendum_id, description, value, cost_center_id, financial_category)
SELECT '22222222-2222-4222-8222-000000000001', 'Vergalhões CA-50 adicionais', 180000,
       (SELECT id FROM public.cost_centers WHERE code = 'CC-003'), 'Estrutura';