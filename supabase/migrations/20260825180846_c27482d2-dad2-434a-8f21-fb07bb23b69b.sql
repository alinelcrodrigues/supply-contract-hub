REVOKE EXECUTE ON FUNCTION public.can_manage_master_data(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_manage_master_data(uuid) TO authenticated, service_role;