-- Create a trigger function that calls IndexNow when a new quiz question is inserted
-- The function already exists as notify_indexnow_on_new_question, we just need to create the trigger

-- First, drop the trigger if it exists (to avoid errors)
DROP TRIGGER IF EXISTS trigger_indexnow_on_new_question ON public.quiz_questions;

-- Create the trigger to call IndexNow on new question insert
CREATE TRIGGER trigger_indexnow_on_new_question
  AFTER INSERT ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_indexnow_on_new_question();

-- Add a comment explaining the trigger
COMMENT ON TRIGGER trigger_indexnow_on_new_question ON public.quiz_questions IS 
'Automatically notifies IndexNow search engines when a new quiz question is added for immediate indexing';