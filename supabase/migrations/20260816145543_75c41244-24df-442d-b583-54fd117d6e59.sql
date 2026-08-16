CREATE OR REPLACE FUNCTION public.admin_disable_team(p_leader_id uuid, p_dissolve_members boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_leader_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_leader_id::text, 'infantry', TRUE)
  ON CONFLICT (user_id, role) DO UPDATE SET is_manual = TRUE;

  IF p_dissolve_members THEN
    DELETE FROM public.user_referrals WHERE referrer_id::text = p_leader_id::text;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_disable_team(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_disable_team(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_disable_team(uuid, boolean) TO service_role;

-- Include every profile that actually has troops, not just users flagged with a leader role
CREATE OR REPLACE FUNCTION public.admin_get_all_team_leaders_performance()
RETURNS TABLE(leader_id text, leader_username text, leader_display_name text, role text, parent_leader_username text, direct_team_size bigint, total_team_size bigint, questions_answered bigint, questions_correct bigint, last_active_date text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH team AS (
    SELECT r.referrer_id AS leader_id, r.referred_id AS member_id
    FROM public.user_referrals r
  ),
  leaders AS (
    SELECT ur.user_id AS uid, ur.role
    FROM public.user_roles ur
    WHERE ur.role IN ('team_leader', 'junior_team_leader', 'king', 'baron', 'knight', 'officer')
    UNION
    SELECT DISTINCT t.leader_id AS uid, NULL::text AS role
    FROM team t
  ),
  merged AS (
    SELECT uid, MAX(role) AS role FROM leaders GROUP BY uid
  )
  SELECT
    p.id,
    p.username,
    p.display_name,
    COALESCE(m.role, (SELECT ur2.role FROM public.user_roles ur2 WHERE ur2.user_id = p.id LIMIT 1), 'infantry') AS role,
    (SELECT p2.username FROM public.user_referrals r2 JOIN public.profiles p2 ON p2.id = r2.referrer_id WHERE r2.referred_id = p.id LIMIT 1) AS parent_leader_username,
    (SELECT COUNT(*) FROM team t WHERE t.leader_id = p.id) AS direct_team_size,
    (SELECT COUNT(*) FROM team t WHERE t.leader_id = p.id) AS total_team_size,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0),
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.correct = true AND qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0),
    (SELECT to_char(MAX(qa.answered_at), 'YYYY-MM-DD') FROM public.quiz_answers qa WHERE qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id))
  FROM merged m
  JOIN public.profiles p ON p.id = m.uid
  WHERE public.is_current_user_admin()
  ORDER BY 6 DESC, p.username;
$$;