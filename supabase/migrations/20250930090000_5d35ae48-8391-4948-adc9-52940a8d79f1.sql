-- Fix RLS policies to allow proper data access

-- 1. Fix login_logs to allow authenticated users to INSERT (but only admins can SELECT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Only admins can access login logs" ON public.login_logs;

CREATE POLICY "Authenticated users can insert login logs"
ON public.login_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all login logs"
ON public.login_logs
FOR SELECT
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Admins can update login logs"
ON public.login_logs
FOR UPDATE
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Admins can delete login logs"
ON public.login_logs
FOR DELETE
TO authenticated
USING (is_current_user_admin());

-- 2. Add admin role to any user with is_admin=true in profiles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Ensure the trigger for tracking attendance works properly
-- The trigger should fire on INSERT to login_logs
DROP TRIGGER IF EXISTS track_user_attendance_trigger ON public.login_logs;

CREATE TRIGGER track_user_attendance_trigger
AFTER INSERT ON public.login_logs
FOR EACH ROW
EXECUTE FUNCTION public.track_user_attendance();