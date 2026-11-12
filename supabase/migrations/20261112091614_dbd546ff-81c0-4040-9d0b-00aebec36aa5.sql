CREATE INDEX IF NOT EXISTS idx_quiz_questions_cat_diff_created ON public.quiz_questions (category, difficulty, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_correct ON public.quiz_answers (user_id, correct, answered_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_ad_views()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.ad_views WHERE view_date < now() - interval '30 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.cleanup_old_ad_views() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('cleanup-old-ad-views', '30 2 * * *', $$SELECT public.cleanup_old_ad_views();$$);