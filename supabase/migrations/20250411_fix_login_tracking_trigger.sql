
-- Check if the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'add_attendance_record_trigger'
  ) THEN
    -- Create trigger to track attendance for each successful login
    CREATE TRIGGER add_attendance_record_trigger
    AFTER INSERT ON public.login_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.track_user_attendance();
    
    RAISE NOTICE 'Created add_attendance_record_trigger on login_logs table';
  ELSE
    RAISE NOTICE 'add_attendance_record_trigger already exists';
  END IF;
END $$;

-- Ensure the login_logs table allows tracking
ALTER TABLE public.login_logs REPLICA IDENTITY FULL;
