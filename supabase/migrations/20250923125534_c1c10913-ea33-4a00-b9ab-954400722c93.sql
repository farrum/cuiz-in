-- Enable RLS only on actual tables (not views)
-- Skip ad_performance_reports and daily_ad_reports as they appear to be views

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_version_performance ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Create security policies for actual tables only
-- Ad interactions - users can insert their own, admins can view all
CREATE POLICY "Users can track their ad clicks"
ON public.ad_clicks
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all ad clicks"
ON public.ad_clicks
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Users can track their ad views"  
ON public.ad_views
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all ad views"
ON public.ad_views
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage ad version performance"
ON public.ad_version_performance
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Login logs - only admins should access these sensitive logs
CREATE POLICY "Only admins can access login logs"
ON public.login_logs
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- News ticker - everyone can read active messages, only admins can manage
CREATE POLICY "Everyone can view active news ticker"
ON public.news_ticker
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage news ticker"
ON public.news_ticker
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- User referrals - users can view their own, admins can view all
CREATE POLICY "Users can view their referrals as referrer"
ON public.user_referrals
FOR SELECT
USING ((auth.uid())::text = referrer_id);

CREATE POLICY "Users can view their referrals as referred"
ON public.user_referrals
FOR SELECT
USING ((auth.uid())::text = referred_id);

CREATE POLICY "Authenticated users can create referrals"
ON public.user_referrals
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all referrals"
ON public.user_referrals
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());