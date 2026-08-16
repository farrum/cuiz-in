-- Admin Team and Roster Controls SQL Functions

-- 1. Reassign member's leader
CREATE OR REPLACE FUNCTION public.admin_reassign_member_leader(
  p_member_id UUID,
  p_new_leader_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader_name TEXT;
  v_leader_email TEXT;
BEGIN
  -- Verify caller is admin or king
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get new leader details
  SELECT COALESCE(display_name, username, 'Leader'), email
  INTO v_leader_name, v_leader_email
  FROM public.profiles
  WHERE id = p_new_leader_id;

  IF v_leader_name IS NULL THEN
    RAISE EXCEPTION 'New leader not found';
  END IF;

  -- Remove any existing referral entry for this member
  DELETE FROM public.user_referrals WHERE referred_id::text = p_member_id::text;

  -- Insert new referral entry
  INSERT INTO public.user_referrals (
    referred_id, referred_name, referred_email,
    referrer_id, referrer_name, referrer_email,
    date, status
  )
  SELECT 
    p_member_id, 
    COALESCE(p.display_name, p.username, 'Member'), 
    p.email,
    p_new_leader_id, 
    v_leader_name, 
    v_leader_email,
    now(),
    'active'
  FROM public.profiles p
  WHERE p.id = p_member_id;

  -- Recalculate roles upward for the new leader
  PERFORM public.apply_hierarchy_promotions_upward(p_new_leader_id);

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reassign_member_leader(UUID, UUID) TO authenticated;

-- 2. Remove user from team
CREATE OR REPLACE FUNCTION public.admin_remove_member_from_team(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_referrer_id UUID;
BEGIN
  -- Verify caller is admin or king
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Find current referrer
  SELECT referrer_id::uuid INTO v_old_referrer_id
  FROM public.user_referrals
  WHERE referred_id::text = p_member_id::text
  LIMIT 1;

  -- Delete referral record
  DELETE FROM public.user_referrals WHERE referred_id::text = p_member_id::text;

  -- Reset role to infantry
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_member_id::text, 'infantry', FALSE)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Recalculate old leader role
  IF v_old_referrer_id IS NOT NULL THEN
    PERFORM public.apply_hierarchy_promotions_upward(v_old_referrer_id);
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_remove_member_from_team(UUID) TO authenticated;

-- 3. Disable team
CREATE OR REPLACE FUNCTION public.admin_disable_team(
  p_leader_id UUID,
  p_dissolve_members BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or king
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 1. Demote the leader to infantry
  DELETE FROM public.user_roles WHERE user_id = p_leader_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_leader_id::text, 'infantry', TRUE)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 2. Optionally dissolve members (detach them from this team)
  IF p_dissolve_members THEN
    DELETE FROM public.user_referrals WHERE referrer_id::text = p_leader_id::text;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_disable_team(UUID, BOOLEAN) TO authenticated;
