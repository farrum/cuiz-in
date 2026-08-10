CREATE OR REPLACE FUNCTION public.get_my_team_presence(p_member_ids text[])
RETURNS TABLE(member_id text, last_seen timestamp with time zone, games_played bigint)
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
  )
  SELECT
    a.mid,
    GREATEST(
      (SELECT MAX(qa.answered_at) FROM public.quiz_answers qa WHERE qa.user_id = a.mid),
      (SELECT MAX(ua.login_time) FROM public.user_attendance ua WHERE ua.user_id = a.mid)
    ) AS last_seen,
    (SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id = a.mid) AS games_played
  FROM allowed a;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_presence(text[]) TO authenticated;