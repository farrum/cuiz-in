-- Enable RLS on all remaining tables that need it based on linter warnings
-- This will fix the "RLS Disabled in Public" errors

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_version_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attendance ENABLE ROW LEVEL SECURITY;