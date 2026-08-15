-- Create RPC function to remove a member from the team
CREATE OR REPLACE FUNCTION public.remove_member_from_team(p_member_id UUID)
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
  -- Get current authenticated user ID
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get caller's role
  SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = v_caller_id::text LIMIT 1;

  -- Ensure caller is a superior or admin
  IF v_caller_role IS NULL OR (
    v_caller_role <> 'admin' AND 
    v_caller_role <> 'king' AND 
    v_caller_role <> 'baron' AND 
    v_caller_role <> 'knight' AND 
    v_caller_role <> 'officer' AND 
    v_caller_role <> 'team_leader' AND 
    v_caller_role <> 'junior_team_leader'
  ) THEN
    RAISE EXCEPTION 'Only superiors can remove members';
  END IF;

  -- Get the member's direct referrer
  SELECT referrer_id::uuid INTO v_member_referrer_id
  FROM public.user_referrals
  WHERE referred_id::text = p_member_id::text
  LIMIT 1;

  IF v_member_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Member is not part of any team';
  END IF;

  -- Ensure caller is authorized: must be admin/king OR the direct leader of the member
  IF v_caller_role <> 'admin' AND v_caller_role <> 'king' AND v_member_referrer_id <> v_caller_id THEN
    RAISE EXCEPTION 'You can only remove members from your own team';
  END IF;

  -- Delete the referral record
  DELETE FROM public.user_referrals WHERE referred_id::text = p_member_id::text;

  -- Reset the member's role to infantry (in case they had officer/knight/baron roles under the leader)
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_member_id::text, 'infantry', FALSE)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Recalculate roles upward starting from the direct leader
  IF v_member_referrer_id IS NOT NULL THEN
    PERFORM public.apply_hierarchy_promotions_upward(v_member_referrer_id);
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.remove_member_from_team(UUID) TO authenticated;
