
-- Fix 1: Harden set_user_context to block anon callers
CREATE OR REPLACE FUNCTION public.set_user_context(user_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Block ALL callers where auth.uid() is NULL or doesn't match
  IF auth.uid() IS NULL OR auth.uid()::text != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot set context for this user';
  END IF;
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$;

-- Fix 2: Remove session variable fallback from get_current_user_id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only use Supabase Auth - no session variable fallback
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid()::text;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix 3: Remove overly permissive policies from daily_points
DROP POLICY IF EXISTS "Allow full access to daily_points" ON daily_points;
DROP POLICY IF EXISTS "Allow select for everyone" ON daily_points;

-- Add admin read policy for daily_points
CREATE POLICY "Admins can manage daily_points" ON daily_points
  FOR ALL TO public
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Fix 4: Remove overly permissive policies from monthly_points
DROP POLICY IF EXISTS "Allow full access to monthly_points" ON monthly_points;
DROP POLICY IF EXISTS "Allow select for everyone" ON monthly_points;

-- Add admin read policy for monthly_points
CREATE POLICY "Admins can manage monthly_points" ON monthly_points
  FOR ALL TO public
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());
