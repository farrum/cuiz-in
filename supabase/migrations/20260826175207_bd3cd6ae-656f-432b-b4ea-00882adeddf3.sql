CREATE OR REPLACE FUNCTION public.admin_get_questions_today()
RETURNS TABLE(user_id text, questions_today bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qa.user_id, count(*)::bigint
  FROM public.quiz_answers qa
  WHERE (qa.answered_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
    AND qa.user_id IS NOT NULL
    AND (
      qa.question_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.daily_challenges dc
        WHERE qa.question_id::text = ANY (dc.question_ids::text[])
      )
    )
  GROUP BY qa.user_id
$$;

REVOKE ALL ON FUNCTION public.admin_get_questions_today() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_questions_today() TO authenticated, service_role;