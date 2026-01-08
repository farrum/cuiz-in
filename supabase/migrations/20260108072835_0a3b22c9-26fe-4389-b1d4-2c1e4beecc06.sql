-- Create function to call IndexNow edge function when new questions are added
CREATE OR REPLACE FUNCTION public.notify_indexnow_on_new_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  question_slug text;
  question_url text;
BEGIN
  -- Generate URL-friendly slug from question
  question_slug := lower(regexp_replace(
    regexp_replace(NEW.question, '[^\w\s-]', '', 'g'),
    '[\s_-]+', '-', 'g'
  ));
  question_slug := left(question_slug, 80);
  
  -- Build the full URL
  question_url := 'https://cuiz.in/quiz/question/' || NEW.id || '/' || question_slug;
  
  -- Call IndexNow edge function via HTTP
  PERFORM net.http_post(
    url := 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/indexnow',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco"}'::jsonb,
    body := jsonb_build_object(
      'urls', jsonb_build_array(question_url),
      'reason', 'new_quiz_question'
    )
  );
  
  RAISE NOTICE 'IndexNow notified for new question: %', question_url;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to call the function on new question insert
DROP TRIGGER IF EXISTS trigger_indexnow_new_question ON public.quiz_questions;

CREATE TRIGGER trigger_indexnow_new_question
  AFTER INSERT ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_indexnow_on_new_question();