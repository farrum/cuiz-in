-- Fix RLS issues preventing ad slot saves
-- Enable RLS on tables where it's missing and create proper policies

-- Enable RLS on ad_slots if not already enabled
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_slots
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ad_slots;
CREATE POLICY "Admins can manage ad slots" ON public.ad_slots
  FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

CREATE POLICY "Public can read active ad slots" ON public.ad_slots  
  FOR SELECT USING (active = true);

-- Enable RLS on ad_slot_versions if not already enabled  
ALTER TABLE public.ad_slot_versions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ad_version_performance if not already enabled
ALTER TABLE public.ad_version_performance ENABLE ROW LEVEL SECURITY;