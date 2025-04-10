
-- Update the account suspension logic to remove automatic suspension
-- This will ensure users are only suspended by admin action

-- Update the function to no longer automatically suspend users
CREATE OR REPLACE FUNCTION public.has_user_been_active_in_days(p_user_id text, p_days integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_attendance
        WHERE user_id = p_user_id
        AND attendance_date > CURRENT_DATE - p_days
    );
END;
$$;
