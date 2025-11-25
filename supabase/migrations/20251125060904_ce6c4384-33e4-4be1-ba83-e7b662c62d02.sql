-- Fix Function Search Path Mutable warning
-- Add search_path to functions that are missing it

-- Fix regenerate_sitemap (SECURITY DEFINER - critical)
CREATE OR REPLACE FUNCTION public.regenerate_sitemap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the sitemap edge function to regenerate the sitemap
  PERFORM net.http_post(
    url := 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/sitemap',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Sitemap regeneration triggered at %', now();
END;
$function$;

-- Fix set_user_context (SECURITY DEFINER - critical)
CREATE OR REPLACE FUNCTION public.set_user_context(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$function$;

-- Fix has_user_been_active_in_days
CREATE OR REPLACE FUNCTION public.has_user_been_active_in_days(p_user_id text, p_days integer)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_attendance
        WHERE user_id = p_user_id
        AND attendance_date > CURRENT_DATE - p_days
    );
END;
$function$;

-- Fix notify_admin_notification
CREATE OR REPLACE FUNCTION public.notify_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM pg_notify(
    'admin_notification',
    json_build_object(
      'id', NEW.id,
      'type', NEW.type,
      'message', NEW.message,
      'user_id', NEW.user_id
    )::text
  );
  RETURN NEW;
END;
$function$;

-- Fix track_user_attendance
CREATE OR REPLACE FUNCTION public.track_user_attendance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    user_profile_id text;
BEGIN
    -- Only proceed if login was successful
    IF NEW.successful = true THEN
        -- Find the user profile by username
        SELECT id INTO user_profile_id 
        FROM profiles 
        WHERE username = NEW.username 
        LIMIT 1;
        
        -- Check if we found a user profile
        IF user_profile_id IS NOT NULL THEN
            -- Insert attendance record with ON CONFLICT to handle duplicates
            INSERT INTO public.user_attendance (
                user_id, 
                username, 
                attendance_date, 
                login_time
            )
            VALUES (
                user_profile_id,
                NEW.username,
                CURRENT_DATE,
                NEW.login_time
            )
            ON CONFLICT (user_id, attendance_date) 
            DO NOTHING;
            
            RAISE NOTICE 'Added attendance record for user: % on date: %', NEW.username, CURRENT_DATE;
        ELSE
            -- Log that we couldn't find a profile for this username
            RAISE NOTICE 'Could not track attendance for username %, profile not found', NEW.username;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix trigger_sitemap_regeneration
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the regeneration function in the background
  PERFORM public.regenerate_sitemap();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix update_team_leader_earnings_updated_at
CREATE OR REPLACE FUNCTION public.update_team_leader_earnings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;