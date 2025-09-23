-- Enable RLS only on actual tables (not views)
-- Skip ad_performance_reports and daily_ad_reports as they are views

-- Enable RLS on remaining actual tables
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for daily_reports (admin only access)
CREATE POLICY "Admins can manage daily reports" ON public.daily_reports
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());