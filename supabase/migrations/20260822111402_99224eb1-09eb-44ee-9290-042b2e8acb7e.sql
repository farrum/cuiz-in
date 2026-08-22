CREATE OR REPLACE FUNCTION public.admin_reassign_member_leader(p_member_id text, p_new_leader_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_leader_name text;
  v_member_name text;
  v_member_email text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_member_id IS NULL OR p_new_leader_id IS NULL THEN
    RAISE EXCEPTION 'Member and leader are required';
  END IF;

  IF p_member_id = p_new_leader_id THEN
    RAISE EXCEPTION 'A member cannot be their own commander';
  END IF;

  SELECT COALESCE(display_name, username) INTO v_leader_name FROM public.profiles WHERE id = p_new_leader_id;
  SELECT COALESCE(display_name, username), email INTO v_member_name, v_member_email FROM public.profiles WHERE id = p_member_id;

  IF v_leader_name IS NULL OR v_member_name IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  DELETE FROM public.user_referrals WHERE referred_id = p_member_id;

  INSERT INTO public.user_referrals (referrer_id, referrer_name, referred_id, referred_name, referred_email, date, status)
  VALUES (p_new_leader_id, v_leader_name, p_member_id, v_member_name, v_member_email, to_char(now(), 'YYYY-MM-DD'), 'active');

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reassign_member_leader(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reassign_member_leader(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reassign_member_leader(text, text) TO service_role;