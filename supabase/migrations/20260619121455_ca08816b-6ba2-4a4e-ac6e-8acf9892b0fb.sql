-- 1. Fix Security Definer View: enforce caller's RLS/permissions
ALTER VIEW public.sitemap_entries SET (security_invoker = on);

-- 2. Fix mutable search_path on SECURITY DEFINER functions
ALTER FUNCTION public.get_hourly_wordle() SET search_path = public;
ALTER FUNCTION public.purchase_skill_node(uuid, text) SET search_path = public;

-- 3. Remove redundant always-true INSERT policy (service_role bypasses RLS already)
DROP POLICY IF EXISTS "Enable edge function blog post creation" ON public.blog_posts;