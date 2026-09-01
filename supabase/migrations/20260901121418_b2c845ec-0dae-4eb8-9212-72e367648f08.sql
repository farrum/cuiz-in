-- Drop the legacy UUID overload if it exists (defensive; avoids any PostgREST ambiguity)
DROP FUNCTION IF EXISTS public.remove_member_from_team(UUID);

-- Recreate the text overload with hierarchy recalculation restored
CREATE OR REPLACE FUNCTION public.remove_member_from_team(p_member_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller text;
  v_is_admin boolean;
  v_referrer text;
BEGIN
  v_caller := auth.uid()::text;
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_admin := public.is_current_user_admin();

  SELECT referrer_id::text INTO v_referrer
  FROM public.user_referrals
  WHERE referred_id::text = p_member_id
  LIMIT 1;

  IF v_referrer IS NULL THEN
    RAISE EXCEPTION 'Member is not part of any team';
  END IF;

  IF NOT v_is_admin AND v_referrer <> v_caller THEN
    RAISE EXCEPTION 'You can only dismiss members of your own team';
  END IF;

  DELETE FROM public.user_referrals WHERE referred_id::text = p_member_id;

  DELETE FROM public.user_roles WHERE user_id = p_member_id AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_member_id, 'infantry', FALSE)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Recalculate promotions upward from the member's former leader so
  -- team-size-based ranks don't go stale after a dismissal.
  IF v_referrer ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    PERFORM public.apply_hierarchy_promotions_upward(v_referrer::uuid);
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_member_from_team(text) TO authenticated;