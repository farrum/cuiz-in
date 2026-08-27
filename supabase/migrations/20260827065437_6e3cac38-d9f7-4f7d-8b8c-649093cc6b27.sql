DROP TRIGGER IF EXISTS validate_user_task_progress_task_id_trigger ON public.user_task_progress;

ALTER TABLE public.user_task_progress
  DROP CONSTRAINT IF EXISTS user_task_progress_task_id_fkey;

ALTER TABLE public.user_task_progress
  ALTER COLUMN task_id TYPE text USING task_id::text;

CREATE OR REPLACE FUNCTION public.validate_user_task_progress_task_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parsed_task_id uuid;
BEGIN
  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.task_id = 'daily_tribute_login' THEN
    RETURN NEW;
  END IF;

  BEGIN
    parsed_task_id := NEW.task_id::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid task identifier'
        USING ERRCODE = '23514';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM public.empire_tasks
    WHERE id = parsed_task_id
  ) THEN
    RAISE EXCEPTION 'Task does not exist'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_user_task_progress_task_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_user_task_progress_task_id() TO service_role;

CREATE TRIGGER validate_user_task_progress_task_id_trigger
BEFORE INSERT OR UPDATE OF task_id ON public.user_task_progress
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_task_progress_task_id();

CREATE UNIQUE INDEX IF NOT EXISTS user_task_progress_user_task_key
  ON public.user_task_progress (user_id, task_id);