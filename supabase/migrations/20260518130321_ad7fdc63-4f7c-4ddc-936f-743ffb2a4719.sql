
-- Restrict public access to correct_answer column to prevent cheating
REVOKE SELECT (correct_answer) ON public.quiz_questions FROM anon, authenticated;

-- Admin RPC: fetch full quiz question rows (including correct_answer)
CREATE OR REPLACE FUNCTION public.admin_get_quiz_questions(p_ids uuid[] DEFAULT NULL)
RETURNS SETOF public.quiz_questions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_ids IS NULL THEN
    RETURN QUERY SELECT * FROM public.quiz_questions ORDER BY created_at DESC;
  ELSE
    RETURN QUERY SELECT * FROM public.quiz_questions WHERE id = ANY(p_ids);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_quiz_questions(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_quiz_questions(uuid[]) TO authenticated;
