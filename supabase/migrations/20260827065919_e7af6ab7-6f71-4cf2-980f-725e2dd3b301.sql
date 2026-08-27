REVOKE ALL ON FUNCTION public.validate_user_task_progress_task_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_user_task_progress_task_id() FROM anon;
REVOKE ALL ON FUNCTION public.validate_user_task_progress_task_id() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_task_progress_task_id() TO service_role;