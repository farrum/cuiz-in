
CREATE OR REPLACE FUNCTION public.get_attempted_correct_answers(p_question_ids uuid[])
RETURNS TABLE(question_id uuid, correct_answer text, explanation text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid text;
BEGIN
  uid := public.get_current_user_id();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be signed in';
  END IF;

  RETURN QUERY
    SELECT q.id, q.correct_answer, q.explanation
    FROM public.quiz_questions q
    WHERE q.id = ANY(p_question_ids)
      AND EXISTS (
        SELECT 1 FROM public.quiz_answers a
        WHERE a.question_id = q.id AND a.user_id = uid
      );
END;
$$;

REVOKE ALL ON FUNCTION public.get_attempted_correct_answers(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempted_correct_answers(uuid[]) TO authenticated;
