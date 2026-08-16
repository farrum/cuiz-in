-- Admin Team and Roster Controls SQL Functions

-- 1. Promote member manually (re-defined to ensure it exists in the schema cache and supports admin actions)
CREATE OR REPLACE FUNCTION public.promote_member_manually(p_member_id UUID, p_new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_member_referrer_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  -- If called from service_role / system, auth.uid() can be NULL, allow it
  IF v_caller_id IS NOT NULL THEN
    -- Get caller's role
    SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = v_caller_id::text LIMIT 1;

    -- Ensure caller is a superior or admin
    IF v_caller_role IS NULL OR (v_caller_role <> 'admin' AND v_caller_role <> 'king' AND v_caller_role <> 'baron' AND v_caller_role <> 'knight' AND v_caller_role <> 'officer') THEN
      RAISE EXCEPTION 'Only superiors can promote members';
    END IF;

    -- Verify member is referred by caller (if caller is not admin/king)
    IF v_caller_role <> 'admin' AND v_caller_role <> 'king' THEN
      SELECT referrer_id::uuid INTO v_member_referrer_id
      FROM public.user_referrals
      WHERE referred_id::uuid = p_member_id;

      IF v_member_referrer_id IS NULL OR v_member_referrer_id <> v_caller_id THEN
        RAISE EXCEPTION 'You can only promote users within your team';
      END IF;
    END IF;
  END IF;

  -- Perform manual promotion (delete existing role first to prevent duplicates)
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_member_id::text, p_new_role, TRUE)
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_manual = TRUE;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_member_manually(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_member_manually(UUID, TEXT) TO service_role;


-- 2. Reassign member's leader
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


-- 3. Remove user from team
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


-- 4. Disable team
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
