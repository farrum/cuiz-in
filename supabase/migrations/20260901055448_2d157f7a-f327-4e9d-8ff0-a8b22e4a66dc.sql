CREATE OR REPLACE FUNCTION public.admin_get_user_activity_today()
RETURNS TABLE(user_id text, questions_total bigint, questions_quest bigint, gems_today numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH bounds AS (
    SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date::timestamp AT TIME ZONE 'Asia/Kolkata') AS day_start,
           (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata') AS day_end,
           to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day_key
  ),
  challenge_qs AS MATERIALIZED (
    SELECT DISTINCT unnest(dc.question_ids)::text AS qid FROM public.daily_challenges dc
  ),
  answers AS (
    SELECT qa.user_id,
           count(*)::bigint AS total,
           count(*) FILTER (
             WHERE qa.question_id IS NOT NULL
               AND qa.question_id::text IN (SELECT qid FROM challenge_qs)
           )::bigint AS quest
    FROM public.quiz_answers qa, bounds b
    WHERE qa.answered_at >= b.day_start
      AND qa.answered_at < b.day_end
      AND qa.user_id IS NOT NULL
    GROUP BY qa.user_id
  ),
  pts AS (
    SELECT dp.user_id, sum(dp.points)::numeric AS gems
    FROM public.daily_points dp, bounds b
    WHERE dp.date = b.day_key
    GROUP BY dp.user_id
  )
  SELECT COALESCE(a.user_id, p.user_id) AS user_id,
         COALESCE(a.total, 0)::bigint,
         COALESCE(a.quest, 0)::bigint,
         COALESCE(p.gems, 0)::numeric
  FROM answers a
  FULL OUTER JOIN pts p ON p.user_id = a.user_id
  WHERE public.is_current_user_admin() OR auth.role() = 'service_role'
$function$;

REVOKE ALL ON FUNCTION public.admin_get_user_activity_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_activity_today() TO authenticated, service_role;