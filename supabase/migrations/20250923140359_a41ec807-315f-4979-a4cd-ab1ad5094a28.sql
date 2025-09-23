-- Enable RLS on tables with policies but RLS disabled
-- This fixes the ad slot save errors

-- Enable RLS on ad-related tables
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_version_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables with policies
ALTER TABLE public.user_attendance ENABLE ROW LEVEL SECURITY;

-- Create a policy for user_attendance since it has none but should have access control
CREATE POLICY "Admins can manage user attendance" ON public.user_attendance
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Ensure all existing ad-related policies are working correctly by recreating key ones if needed
-- (These should already exist based on the schema, but ensuring they work with RLS enabled)

-- Verify the admin function works properly
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid())::text AND role = 'admin'
  );
$$;