-- Indexes to stop full-table scans on quiz_answers (root cause of statement timeouts)
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_answered ON public.quiz_answers (user_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_answered_at ON public.quiz_answers (answered_at);

-- Lookups used heavily by admin / team-leader reporting functions
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals (referred_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);

-- Faster "questions today" report: compute challenge question ids once instead of per-row
CREATE OR REPLACE FUNCTION public.admin_get_questions_today()
RETURNS TABLE(user_id text, questions_today bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH challenge_qs AS MATERIALIZED (
    SELECT DISTINCT unnest(dc.question_ids)::text AS qid
    FROM public.daily_challenges dc
  )
  SELECT qa.user_id, count(*)::bigint
  FROM public.quiz_answers qa
  WHERE qa.answered_at >= ((now() AT TIME ZONE 'Asia/Kolkata')::date::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND qa.answered_at < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND qa.user_id IS NOT NULL
    AND (
      qa.question_id IS NULL
      OR qa.question_id::text NOT IN (SELECT qid FROM challenge_qs)
    )
  GROUP BY qa.user_id
$function$;