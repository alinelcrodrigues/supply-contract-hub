CREATE TABLE public.financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'despesa',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_categories TO authenticated;
GRANT ALL ON public.financial_categories TO service_role;

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc_select" ON public.financial_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "fc_manage" ON public.financial_categories FOR ALL TO authenticated
  USING (public.can_manage_master_data(auth.uid()))
  WITH CHECK (public.can_manage_master_data(auth.uid()));

CREATE TRIGGER financial_categories_set_updated_at BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();