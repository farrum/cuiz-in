-- Team Joining, Resignations & Member Activity Tracking SQL Functions

-- 1. Resign from team RPC
CREATE OR REPLACE FUNCTION public.resign_from_team()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_old_referrer_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find their current referrer
  SELECT referrer_id::uuid INTO v_old_referrer_id
  FROM public.user_referrals
  WHERE referred_id::text = v_caller_id::text
  LIMIT 1;

  IF v_old_referrer_id IS NULL THEN
    RAISE EXCEPTION 'You are not in any team';
  END IF;

  -- Delete the referral record
  DELETE FROM public.user_referrals WHERE referred_id::text = v_caller_id::text;

  -- Reset their role to infantry
  DELETE FROM public.user_roles WHERE user_id = v_caller_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (v_caller_id::text, 'infantry', FALSE)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Recalculate roles upward for their old team leader
  IF v_old_referrer_id IS NOT NULL THEN
    PERFORM public.apply_hierarchy_promotions_upward(v_old_referrer_id);
  END IF;

  -- Delete any pending requests they had
  DELETE FROM public.team_join_requests WHERE user_id = v_caller_id AND status = 'pending';

  RETURN TRUE;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.resign_from_team() TO authenticated;

-- 2. Add delete policy on team_join_requests
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.team_join_requests;
CREATE POLICY "Users can delete their own requests" 
ON public.team_join_requests FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 3. Secure helper function for member attendance
CREATE OR REPLACE FUNCTION public.get_member_attendance(p_member_id UUID)
RETURNS TABLE (
  attendance_date DATE,
  login_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_leader BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if caller is leader of this member, or if caller is the member themselves, or an admin
  v_is_leader := EXISTS (
    SELECT 1 
    FROM public.user_referrals 
    WHERE referred_id::text = p_member_id::text 
      AND referrer_id::text = v_caller_id::text
  );

  IF v_caller_id <> p_member_id AND NOT v_is_leader AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized to view this member''s activity';
  END IF;

  RETURN QUERY
  SELECT ua.attendance_date, ua.login_time
  FROM public.user_attendance ua
  WHERE ua.user_id::text = p_member_id::text
  ORDER BY ua.attendance_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_attendance(UUID) TO authenticated;

-- 4. Secure helper function for member quiz answers
CREATE OR REPLACE FUNCTION public.get_member_quiz_answers(p_member_id UUID)
RETURNS TABLE (
  answered_at TIMESTAMPTZ,
  correct BOOLEAN,
  selected_answer TEXT,
  question TEXT,
  category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_leader BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_leader := EXISTS (
    SELECT 1 
    FROM public.user_referrals 
    WHERE referred_id::text = p_member_id::text 
      AND referrer_id::text = v_caller_id::text
  );

  IF v_caller_id <> p_member_id AND NOT v_is_leader AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized to view this member''s activity';
  END IF;

  RETURN QUERY
  SELECT qa.answered_at, qa.correct, qa.selected_answer, q.question, q.category
  FROM public.quiz_answers qa
  LEFT JOIN public.quiz_questions q ON qa.question_id::text = q.id::text
  WHERE qa.user_id::text = p_member_id::text
  ORDER BY qa.answered_at DESC
  LIMIT 30;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_quiz_answers(UUID) TO authenticated;

-- 5. Secure helper function for member wheel spins
CREATE OR REPLACE FUNCTION public.get_member_wheel_spins(p_member_id UUID)
RETURNS TABLE (
  spun_on TEXT,
  prize_label TEXT,
  prize_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_leader BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_leader := EXISTS (
    SELECT 1 
    FROM public.user_referrals 
    WHERE referred_id::text = p_member_id::text 
      AND referrer_id::text = v_caller_id::text
  );

  IF v_caller_id <> p_member_id AND NOT v_is_leader AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized to view this member''s activity';
  END IF;

  RETURN QUERY
  SELECT ws.spun_on::text, ws.prize_label, ws.prize_value::numeric
  FROM public.wheel_spins ws
  WHERE ws.user_id::text = p_member_id::text
  ORDER BY ws.created_at DESC
  LIMIT 30;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_wheel_spins(UUID) TO authenticated;

-- 6. Secure helper function for member tasks
CREATE OR REPLACE FUNCTION public.get_member_tasks(p_member_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  target_count INT,
  current_count INT,
  type TEXT,
  reward_gems INT,
  reward_stars INT,
  reward_shards INT,
  shard_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_leader BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_leader := EXISTS (
    SELECT 1 
    FROM public.user_referrals 
    WHERE referred_id::text = p_member_id::text 
      AND referrer_id::text = v_caller_id::text
  );

  IF v_caller_id <> p_member_id AND NOT v_is_leader AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized to view this member''s activity';
  END IF;

  RETURN QUERY
  SELECT et.id, et.title, et.description, et.target_count, et.current_count, et.type, 
         et.reward_gems, et.reward_stars, et.reward_shards, et.shard_type, et.status, et.created_at
  FROM public.empire_tasks et
  WHERE et.assigned_to = p_member_id
  ORDER BY et.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_tasks(UUID) TO authenticated;
