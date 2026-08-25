-- 007_cadastros_mestres

CREATE OR REPLACE FUNCTION public.can_manage_master_data(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::public.app_role, 'comprador'::public.app_role)
  )
$$;

-- Fornecedores
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name text NOT NULL,
  legal_name text NOT NULL DEFAULT '',
  doc text,
  doc_type text NOT NULL DEFAULT 'CNPJ',
  address text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  representative text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_suppliers_trade_name ON public.suppliers (trade_name);
CREATE INDEX idx_suppliers_doc ON public.suppliers (doc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem fornecedores" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Compradores gerenciam fornecedores" ON public.suppliers FOR ALL TO authenticated
  USING (public.can_manage_master_data(auth.uid())) WITH CHECK (public.can_manage_master_data(auth.uid()));

-- Produtos e serviços
CREATE TABLE public.products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'produto',
  sku text,
  name text NOT NULL,
  fiscal_code text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_services_kind_check CHECK (kind IN ('produto','servico'))
);
CREATE INDEX idx_products_services_name ON public.products_services (name);
CREATE INDEX idx_products_services_kind ON public.products_services (kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_services TO authenticated;
GRANT ALL ON public.products_services TO service_role;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem produtos e servicos" ON public.products_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Compradores gerenciam produtos e servicos" ON public.products_services FOR ALL TO authenticated
  USING (public.can_manage_master_data(auth.uid())) WITH CHECK (public.can_manage_master_data(auth.uid()));

-- Centro de custo: gestão pelo comprador também
DROP POLICY IF EXISTS "Compradores gerenciam centros de custo" ON public.cost_centers;
CREATE POLICY "Compradores gerenciam centros de custo" ON public.cost_centers FOR ALL TO authenticated
  USING (public.can_manage_master_data(auth.uid())) WITH CHECK (public.can_manage_master_data(auth.uid()));

-- Solicitação de contrato passa a referenciar o fornecedor cadastrado
ALTER TABLE public.contract_requests
  ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_products_services_updated_at BEFORE UPDATE ON public.products_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();