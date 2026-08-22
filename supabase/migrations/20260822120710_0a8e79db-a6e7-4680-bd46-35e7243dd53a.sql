CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.role
  FROM public.user_roles r
  WHERE r.user_id = p_user_id
  ORDER BY array_position(
    ARRAY['infantry','player','junior_team_leader','officer','knight','team_leader','baron','king','admin'],
    lower(r.role)
  ) DESC NULLS LAST
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_user_rank(text) TO anon, authenticated, service_role;