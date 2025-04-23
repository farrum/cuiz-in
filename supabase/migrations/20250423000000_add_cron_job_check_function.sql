
-- Create function to check cron job status
CREATE OR REPLACE FUNCTION public.check_cron_job_status(job_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_info json;
BEGIN
  SELECT json_agg(job.*)
  INTO job_info
  FROM pg_cron.job
  WHERE job.jobname = job_name;
  
  RETURN COALESCE(job_info, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;
