-- Fix column grants - add missing columns that were revoked
REVOKE ALL ON TABLE public.profiles FROM authenticated;

GRANT SELECT (id, username, display_name, email, phone, points, profile_picture, suspended, 
  is_admin, created_at, auth_migrated, upi_id, 
  reactivation_requested, reactivation_requested_at,
  reactivation_approved, reactivation_approved_at) ON public.profiles TO authenticated;

GRANT INSERT ON public.profiles TO authenticated;

GRANT UPDATE (display_name, phone, email, profile_picture, upi_id, password_hash, 
  reactivation_requested, reactivation_requested_at, suspended, reactivation_approved, 
  reactivation_approved_at, auth_migrated) ON public.profiles TO authenticated;

REVOKE ALL ON TABLE public.profiles FROM anon;
GRANT SELECT (id, username, display_name, points, profile_picture) ON public.profiles TO anon;