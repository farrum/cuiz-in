
CREATE OR REPLACE FUNCTION public.admin_get_all_team_leaders_performance()
RETURNS TABLE (
  leader_id text,
  leader_username text,
  leader_display_name text,
  role text,
  parent_leader_username text,
  direct_team_size bigint,
  total_team_size bigint,
  questions_answered bigint,
  questions_correct bigint,
  last_active_date text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH leaders AS (
    SELECT ur.user_id, ur.role
    FROM public.user_roles ur
    WHERE ur.role IN ('team_leader', 'junior_team_leader')
  ),
  team AS (
    SELECT r.referrer_id AS leader_id, r.referred_id AS member_id
    FROM public.user_referrals r
  )
  SELECT
    p.id AS leader_id,
    p.username AS leader_username,
    p.display_name AS leader_display_name,
    l.role,
    NULL::text AS parent_leader_username,
    (SELECT COUNT(*) FROM team t WHERE t.leader_id = p.id) AS direct_team_size,
    (SELECT COUNT(*) FROM team t WHERE t.leader_id = p.id) AS total_team_size,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) AS questions_answered,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.correct = true AND qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) AS questions_correct,
    (SELECT to_char(MAX(qa.answered_at), 'YYYY-MM-DD') FROM public.quiz_answers qa WHERE qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)) AS last_active_date
  FROM leaders l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE public.is_current_user_admin()
  ORDER BY p.username;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_team_ad_performance()
RETURNS TABLE (
  leader_id text,
  leader_username text,
  leader_display_name text,
  total_team_size bigint,
  questions_answered bigint,
  ad_impressions bigint,
  ad_clicks bigint,
  ctr numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH leaders AS (
    SELECT ur.user_id, ur.role
    FROM public.user_roles ur
    WHERE ur.role IN ('team_leader', 'junior_team_leader')
  ),
  team AS (
    SELECT r.referrer_id AS leader_id, r.referred_id AS member_id
    FROM public.user_referrals r
  )
  SELECT
    p.id AS leader_id,
    p.username AS leader_username,
    p.display_name AS leader_display_name,
    (SELECT COUNT(*) FROM team t WHERE t.leader_id = p.id) AS total_team_size,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) AS questions_answered,
    COALESCE((SELECT COUNT(*) FROM public.ad_views av WHERE av.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) AS ad_impressions,
    COALESCE((SELECT COUNT(*) FROM public.ad_clicks ac WHERE ac.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) AS ad_clicks,
    CASE
      WHEN COALESCE((SELECT COUNT(*) FROM public.ad_views av WHERE av.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0) > 0
      THEN ROUND(
        COALESCE((SELECT COUNT(*) FROM public.ad_clicks ac WHERE ac.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0)::numeric
        / COALESCE((SELECT COUNT(*) FROM public.ad_views av WHERE av.user_id IN (SELECT member_id FROM team t WHERE t.leader_id = p.id)), 0)::numeric * 100, 2)
      ELSE 0
    END AS ctr
  FROM leaders l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE public.is_current_user_admin()
  ORDER BY p.username;
$$;
