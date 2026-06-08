-- Fix: user_referrals INSERT must enforce referrer ownership
DROP POLICY IF EXISTS "Authenticated users can create referrals" ON public.user_referrals;
CREATE POLICY "Users can create their own referrals"
ON public.user_referrals
FOR INSERT
WITH CHECK (referrer_id = public.get_current_user_id());

-- Fix: ad_clicks INSERT must not allow attributing to other users
DROP POLICY IF EXISTS "Users can track their ad clicks" ON public.ad_clicks;
CREATE POLICY "Users can track their ad clicks"
ON public.ad_clicks
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND (user_id IS NULL OR user_id = (auth.uid())::text));

-- Fix: ad_views INSERT must not allow attributing to other users
DROP POLICY IF EXISTS "Users can track their ad views" ON public.ad_views;
CREATE POLICY "Users can track their ad views"
ON public.ad_views
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND (user_id IS NULL OR user_id = (auth.uid())::text));

-- Fix: allow users to read their own attendance records
CREATE POLICY "Users can view their own attendance"
ON public.user_attendance
FOR SELECT
USING (user_id = (auth.uid())::text);