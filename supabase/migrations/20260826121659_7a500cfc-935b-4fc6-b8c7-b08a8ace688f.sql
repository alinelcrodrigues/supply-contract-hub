INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin','master_data.manage'),
  ('comprador','master_data.manage'),
  ('admin','carreteiros.manage'),
  ('gestor','carreteiros.manage'),
  ('comprador','carreteiros.manage')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Compradores gerenciam fornecedores" ON public.suppliers;
CREATE POLICY "suppliers_manage" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'master_data.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'master_data.manage'));

DROP POLICY IF EXISTS "Compradores gerenciam produtos e servicos" ON public.products_services;
CREATE POLICY "products_services_manage" ON public.products_services FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'master_data.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'master_data.manage'));

DROP POLICY IF EXISTS "Compradores gerenciam centros de custo" ON public.cost_centers;
DROP POLICY IF EXISTS "cost_centers_admin_write" ON public.cost_centers;
CREATE POLICY "cost_centers_manage" ON public.cost_centers FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'master_data.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'master_data.manage'));

DROP POLICY IF EXISTS "fc_manage" ON public.financial_categories;
CREATE POLICY "financial_categories_manage" ON public.financial_categories FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'master_data.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'master_data.manage'));