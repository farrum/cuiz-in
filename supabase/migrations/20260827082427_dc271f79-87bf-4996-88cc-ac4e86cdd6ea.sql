REVOKE ALL ON FUNCTION public.admin_get_client_diagnostics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_client_diagnostics(integer) TO authenticated;
