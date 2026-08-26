CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  );
$$;

INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, 'approval_tiers.manage'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions WHERE role = 'admin'::public.app_role AND permission = 'approval_tiers.manage'
);

DROP POLICY IF EXISTS approval_tiers_admin_write ON public.approval_tiers;
CREATE POLICY approval_tiers_manage ON public.approval_tiers
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'approval_tiers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'approval_tiers.manage'));

DROP POLICY IF EXISTS approval_tier_steps_admin_write ON public.approval_tier_steps;
CREATE POLICY approval_tier_steps_manage ON public.approval_tier_steps
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'approval_tiers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'approval_tiers.manage'));

DROP POLICY IF EXISTS mat_admin_write ON public.measurement_approval_tiers;
CREATE POLICY measurement_approval_tiers_manage ON public.measurement_approval_tiers
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'approval_tiers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'approval_tiers.manage'));

DROP POLICY IF EXISTS mats_admin_write ON public.measurement_approval_tier_steps;
CREATE POLICY measurement_approval_tier_steps_manage ON public.measurement_approval_tier_steps
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'approval_tiers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'approval_tiers.manage'));