-- Phase 1: Fix immediate RLS issues to get site working

-- 1. Update get_current_user_id() to work better with legacy auth
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- First try Supabase Auth
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid()::text;
  END IF;
  
  -- Fall back to session variable for legacy auth
  v_user_id := current_setting('app.current_user_id', true);
  
  IF v_user_id IS NOT NULL AND v_user_id != '' THEN
    RETURN v_user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 2. Fix login_logs RLS to allow inserts for both auth types
DROP POLICY IF EXISTS "Authenticated users can insert login logs" ON login_logs;
CREATE POLICY "Anyone can insert login logs"
ON login_logs
FOR INSERT
WITH CHECK (true);

-- 3. Update profiles RLS to allow reading with legacy auth
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (
  id = get_current_user_id() 
  OR (auth.uid())::text = id
  OR is_current_user_admin()
);

-- 4. Update profiles RLS for updates
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (
  id = get_current_user_id()
  OR (auth.uid())::text = id
  OR is_current_user_admin()
);

-- 5. Fix quiz_answers RLS to allow inserts with legacy auth
DROP POLICY IF EXISTS "Users can insert their own quiz answers" ON quiz_answers;
CREATE POLICY "Users can insert their own quiz answers"
ON quiz_answers
FOR INSERT
WITH CHECK (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
);

-- 6. Fix quiz_answers SELECT policy
DROP POLICY IF EXISTS "Users can view their own quiz answers" ON quiz_answers;
CREATE POLICY "Users can view their own quiz answers"
ON quiz_answers
FOR SELECT
USING (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
  OR (SELECT role FROM user_roles WHERE user_id = (auth.uid())::text) = 'admin'
);

-- 7. Update daily_points policies
DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON daily_points;
CREATE POLICY "Users can insert their daily points"
ON daily_points
FOR INSERT
WITH CHECK (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON daily_points;
CREATE POLICY "Users can update their daily points"
ON daily_points
FOR UPDATE
USING (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
);

-- 8. Update monthly_points policies
DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON monthly_points;
CREATE POLICY "Users can insert their monthly points"
ON monthly_points
FOR INSERT
WITH CHECK (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON monthly_points;
CREATE POLICY "Users can update their monthly points"
ON monthly_points
FOR UPDATE
USING (
  user_id = get_current_user_id()
  OR user_id = (auth.uid())::text
);

-- 9. Update user_attendance RLS to allow inserts
CREATE POLICY "System can insert attendance"
ON user_attendance
FOR INSERT
WITH CHECK (true);

-- 10. Comment explaining the situation
COMMENT ON FUNCTION get_current_user_id IS 'Returns current user ID from Supabase Auth or legacy session variable. Used during migration period.';