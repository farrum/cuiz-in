
-- Enable the pg_cron and pg_net extensions if they're not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call our edge function
CREATE OR REPLACE FUNCTION public.trigger_daily_blog_generator()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT net.http_post(
      url:='https://pgywvtphfidouakypdno.supabase.co/functions/v1/daily-blog-generator',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Schedule the function to run daily at 1:00 AM UTC
SELECT cron.schedule(
  'daily-blog-generator',
  '0 1 * * *', -- Run at 1:00 AM UTC every day
  $$
  SELECT public.trigger_daily_blog_generator();
  $$
);
