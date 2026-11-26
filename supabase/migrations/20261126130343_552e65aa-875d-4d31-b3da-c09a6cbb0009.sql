ALTER FUNCTION public.get_alliance_rankings() SET search_path = public;

DROP POLICY IF EXISTS "Authenticated users can insert own login logs" ON public.login_logs;
CREATE POLICY "Users can insert their own login logs" ON public.login_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()::text AND lower(p.username) = lower(login_logs.username)));

DROP POLICY IF EXISTS "Authenticated users can view ad slot versions" ON public.ad_slot_versions;

DROP POLICY IF EXISTS "Allow ad_views inserts from anon/authenticated" ON public.ad_views;
DROP POLICY IF EXISTS "Allow ad_views inserts from public" ON public.ad_views;
CREATE POLICY "Guests can track anonymous ad views" ON public.ad_views FOR INSERT TO anon
WITH CHECK (user_id IS NULL);