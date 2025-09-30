-- Phase 1: Database Schema Updates for Supabase Auth Migration
-- This migration enables hybrid auth (custom + Supabase Auth) during transition period

-- 1. Add email column to profiles (nullable for now, required after migration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_migrated boolean DEFAULT false;

-- 2. Create helper function that works with BOTH auth methods
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_user_id uuid;
  custom_user_id text;
BEGIN
  -- First try Supabase auth
  supabase_user_id := auth.uid();
  IF supabase_user_id IS NOT NULL THEN
    RETURN supabase_user_id::text;
  END IF;
  
  -- Fallback to custom auth via session variable
  custom_user_id := current_setting('app.current_user_id', true);
  IF custom_user_id IS NOT NULL AND custom_user_id != '' THEN
    RETURN custom_user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 3. Update admin check function to use new helper
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = public.get_current_user_id() AND role = 'admin'
  );
$$;

-- 4. Update get_current_user_role to use new helper
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = public.get_current_user_id() LIMIT 1;
$$;

-- 5. Create function to set custom user context
CREATE OR REPLACE FUNCTION public.set_user_context(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$;

-- 6. Update ALL RLS policies to use the new helper function

-- Profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = get_current_user_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = get_current_user_id());

-- Allow new user creation via Supabase auth
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
CREATE POLICY "Enable insert for authentication" ON profiles
  FOR INSERT WITH CHECK (id = get_current_user_id() OR auth.uid()::text = id);

-- Quiz answers
DROP POLICY IF EXISTS "Users can view their own quiz answers" ON quiz_answers;
CREATE POLICY "Users can view their own quiz answers" ON quiz_answers
  FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can insert their own quiz answers" ON quiz_answers;
CREATE POLICY "Users can insert their own quiz answers" ON quiz_answers
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Daily points
DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON daily_points;
CREATE POLICY "Allow insert/update for authenticated users" ON daily_points
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Allow update for authenticated users" ON daily_points;
CREATE POLICY "Allow update for authenticated users" ON daily_points
  FOR UPDATE USING (user_id = get_current_user_id());

-- Monthly points
DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON monthly_points;
CREATE POLICY "Allow insert/update for authenticated users" ON monthly_points
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Allow update for authenticated users" ON monthly_points;
CREATE POLICY "Allow update for authenticated users" ON monthly_points
  FOR UPDATE USING (user_id = get_current_user_id());

-- Login streaks
DROP POLICY IF EXISTS "Users can view their own login streaks" ON login_streaks;
CREATE POLICY "Users can view their own login streaks" ON login_streaks
  FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can update their own login streaks" ON login_streaks;
CREATE POLICY "Users can update their own login streaks" ON login_streaks
  FOR UPDATE USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can insert their own login streaks" ON login_streaks;
CREATE POLICY "Users can insert their own login streaks" ON login_streaks
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- User challenge progress
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can view their own challenge progress" ON user_challenge_progress
  FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can insert their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can insert their own challenge progress" ON user_challenge_progress
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can update their own challenge progress" ON user_challenge_progress
  FOR UPDATE USING (user_id = get_current_user_id());

-- Payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can insert payment requests" ON payments;
CREATE POLICY "Users can insert payment requests" ON payments
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- User referrals
DROP POLICY IF EXISTS "Users can view their referrals as referrer" ON user_referrals;
CREATE POLICY "Users can view their referrals as referrer" ON user_referrals
  FOR SELECT USING (referrer_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can view their referrals as referred" ON user_referrals;
CREATE POLICY "Users can view their referrals as referred" ON user_referrals
  FOR SELECT USING (referred_id = get_current_user_id());

-- User roles
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (user_id = get_current_user_id());

-- Team leader earnings
DROP POLICY IF EXISTS "Team leaders can view their own earnings" ON team_leader_earnings;
CREATE POLICY "Team leaders can view their own earnings" ON team_leader_earnings
  FOR SELECT USING (team_leader_id = get_current_user_id());

-- 7. Create trigger to auto-create profile when Supabase auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, phone, email, auth_migrated)
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.email,
    true
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id::text, 'player');
  
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new Supabase auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();