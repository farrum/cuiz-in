CREATE OR REPLACE FUNCTION public.get_my_team_analytics(p_member_ids text[], p_days integer DEFAULT 30)
RETURNS TABLE(member_id text, day date, answers bigint, correct bigint, quiz_points numeric, gems numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH allowed AS (
    SELECT r.referred_id AS mid
    FROM public.user_referrals r
    WHERE r.referrer_id = public.get_current_user_id()
      AND r.referred_id = ANY(p_member_ids)
    UNION
    SELECT m
    FROM unnest(p_member_ids) AS m
    WHERE public.is_current_user_admin()
  ),
  span AS (
    SELECT (CURRENT_DATE - (GREATEST(LEAST(COALESCE(p_days, 30), 180), 1) - 1))::date AS from_day
  ),
  qa AS (
    SELECT q.user_id AS mid,
           (q.answered_at AT TIME ZONE 'UTC')::date AS day,
           COUNT(*)::bigint AS answers,
           COUNT(*) FILTER (WHERE q.correct)::bigint AS correct,
           COALESCE(SUM(q.points_earned), 0)::numeric AS quiz_points
    FROM public.quiz_answers q
    JOIN allowed a ON a.mid = q.user_id
    CROSS JOIN span s
    WHERE q.answered_at >= s.from_day
    GROUP BY 1, 2
  ),
  dp AS (
    SELECT d.user_id AS mid, d.date::date AS day, COALESCE(SUM(d.points), 0)::numeric AS gems
    FROM public.daily_points d
    JOIN allowed a ON a.mid = d.user_id
    CROSS JOIN span s
    WHERE d.date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND d.date::date >= s.from_day
    GROUP BY 1, 2
  )
  SELECT COALESCE(qa.mid, dp.mid) AS member_id,
         COALESCE(qa.day, dp.day) AS day,
         COALESCE(qa.answers, 0) AS answers,
         COALESCE(qa.correct, 0) AS correct,
         COALESCE(qa.quiz_points, 0) AS quiz_points,
         COALESCE(dp.gems, 0) AS gems
  FROM qa
  FULL OUTER JOIN dp ON dp.mid = qa.mid AND dp.day = qa.day;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_analytics(text[], integer) TO authenticated;