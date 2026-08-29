
-- Properly set a user's rank (replaces ALL existing roles, including admin)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id text, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = public.get_current_user_id() AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot remove your own admin rank';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_user_id, p_role, TRUE)
  ON CONFLICT (user_id, role) DO UPDATE SET is_manual = TRUE;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text) TO authenticated;

-- Text-id version of team dissolve that fully demotes the leader
CREATE OR REPLACE FUNCTION public.admin_disable_team(p_leader_id text, p_dissolve_members boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_leader_id = public.get_current_user_id() THEN
    RAISE EXCEPTION 'You cannot dissolve your own account';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_leader_id;

  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_leader_id, 'infantry', TRUE)
  ON CONFLICT (user_id, role) DO UPDATE SET is_manual = TRUE;

  IF p_dissolve_members THEN
    DELETE FROM public.user_referrals WHERE referrer_id::text = p_leader_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_disable_team(text, boolean) TO authenticated;

-- Remove a member from their team
CREATE OR REPLACE FUNCTION public.admin_remove_member_from_team(p_member_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.user_referrals WHERE referred_id::text = p_member_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_remove_member_from_team(text) TO authenticated;
