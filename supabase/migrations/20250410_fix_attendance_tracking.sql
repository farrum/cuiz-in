
-- Fix the track_user_attendance function to properly handle user IDs from login logs
CREATE OR REPLACE FUNCTION public.track_user_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.successful = true THEN
        -- First check if the username exists in profiles
        IF EXISTS (SELECT 1 FROM profiles WHERE username = NEW.username) THEN
            INSERT INTO public.user_attendance (user_id, username, attendance_date, login_time)
            VALUES (
                (SELECT id FROM profiles WHERE username = NEW.username LIMIT 1),
                NEW.username,
                CURRENT_DATE,
                NEW.login_time
            )
            ON CONFLICT (user_id, attendance_date) DO NOTHING;
        ELSE
            -- Log that we couldn't find a user for this login
            RAISE NOTICE 'Could not track attendance for username %, no matching profile found', NEW.username;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Ensure user_attendance table has proper constraints to prevent duplicates
ALTER TABLE user_attendance DROP CONSTRAINT IF EXISTS unique_user_attendance;
ALTER TABLE user_attendance ADD CONSTRAINT unique_user_attendance UNIQUE (user_id, attendance_date);
