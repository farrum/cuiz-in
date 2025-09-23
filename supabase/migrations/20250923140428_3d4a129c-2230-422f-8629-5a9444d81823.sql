-- Enable RLS on all remaining public tables to fix security issues
ALTER TABLE public.ad_performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ad_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Add necessary RLS policies for tables that don't have them

-- Policies for ad_performance_reports (admin only access)
CREATE POLICY "Admins can manage ad performance reports" ON public.ad_performance_reports
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Policies for daily_ad_reports (admin only access) 
CREATE POLICY "Admins can manage daily ad reports" ON public.daily_ad_reports
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Policies for daily_reports (admin only access)
CREATE POLICY "Admins can manage daily reports" ON public.daily_reports
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());