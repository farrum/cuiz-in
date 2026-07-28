CREATE OR REPLACE FUNCTION public.get_gk_hub_questions(p_per_category integer DEFAULT 15)
RETURNS TABLE (id uuid, question text, correct_answer text, explanation text, category text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT q.id, q.question, q.correct_answer, q.explanation, q.category,
           row_number() OVER (PARTITION BY q.category ORDER BY q.created_at NULLS LAST, q.id) AS rn
    FROM public.quiz_questions q
    WHERE q.category IS NOT NULL
      AND q.question IS NOT NULL
      AND q.correct_answer IS NOT NULL
  )
  SELECT r.id, r.question, r.correct_answer, r.explanation, r.category
  FROM ranked r
  WHERE r.rn <= LEAST(GREATEST(COALESCE(p_per_category, 15), 1), 25)
  ORDER BY r.category, r.rn;
$$;

REVOKE ALL ON FUNCTION public.get_gk_hub_questions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gk_hub_questions(integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_quiz_question_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.quiz_questions;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_question_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_question_count() TO anon, authenticated, service_role;