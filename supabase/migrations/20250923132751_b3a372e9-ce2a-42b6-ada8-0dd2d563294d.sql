-- Final security hardening - enable RLS on remaining tables
-- and fix any remaining policy/RLS mismatches

-- Enable RLS on ad_slot_versions if not already enabled
ALTER TABLE public.ad_slot_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_slot_versions - only admins should manage these
CREATE POLICY "Admins can manage ad slot versions"
ON public.ad_slot_versions
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Authenticated users can view ad slot versions"
ON public.ad_slot_versions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Check if any other critical tables need RLS enabled
-- Based on schema, these should have RLS if they contain user data:

-- Enable RLS on ad_slots table if policies exist but RLS is disabled
DO $$
BEGIN
  -- Only enable if not already enabled
  IF NOT (SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_slots' AND rowsecurity = true)) THEN
    EXECUTE 'ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;