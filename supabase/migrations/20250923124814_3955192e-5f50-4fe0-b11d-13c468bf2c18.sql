-- Fix critical security vulnerability in profiles table access

-- First, create a security definer function to safely check user roles
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_roles WHERE user_id = (auth.uid())::text LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid())::text AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Add proper RLS policies to user_roles table (currently has NONE!)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.is_current_user_admin());

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING ((auth.uid())::text = user_id);

-- Only admins can manage user roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create secure policies for profiles table using security definer functions
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_current_user_admin());

-- Ensure profiles table is properly secured - no public access
-- Users can only access their own profiles, admins can access all
CREATE POLICY "Block all unauthorized access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (
  ((auth.uid())::text = id) OR public.is_current_user_admin()
);