-- Fix 1: Harden set_user_context to only allow setting context for the authenticated user
CREATE OR REPLACE FUNCTION public.set_user_context(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow if no Supabase auth session exists (legacy auth only)
  -- If auth.uid() is set, the user_id MUST match
  IF auth.uid() IS NOT NULL AND auth.uid()::text != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot set context for another user';
  END IF;
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$;

-- Fix 2: Revoke direct SELECT on password_hash from anon and authenticated roles
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;

-- Re-grant with column-level security (exclude password_hash)
GRANT SELECT (id, username, display_name, email, phone, points, profile_picture, suspended, 
  is_admin, created_at, auth_migrated, upi_id, reactivation_requested, reactivation_requested_at,
  reactivation_approved, reactivation_approved_at) ON public.profiles TO authenticated;
GRANT SELECT (id, username, display_name, points, profile_picture) ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, phone, email, profile_picture, upi_id, password_hash, 
  reactivation_requested, reactivation_requested_at, suspended, reactivation_approved, 
  reactivation_approved_at, auth_migrated) ON public.profiles TO authenticated;
