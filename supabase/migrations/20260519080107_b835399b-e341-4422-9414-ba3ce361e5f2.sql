
-- Drop duplicate triggers on login_logs (keep only one)
DROP TRIGGER IF EXISTS track_user_attendance_trigger ON public.login_logs;
DROP TRIGGER IF EXISTS add_attendance_record_trigger ON public.login_logs;
-- track_attendance_on_login remains

-- Make the trigger function SECURITY DEFINER so it can write attendance
-- regardless of the calling user's RLS context.
CREATE OR REPLACE FUNCTION public.track_user_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_profile_id text;
BEGIN
    IF NEW.successful = true THEN
        SELECT id INTO user_profile_id
        FROM profiles
        WHERE username = NEW.username
        LIMIT 1;

        IF user_profile_id IS NOT NULL THEN
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
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
