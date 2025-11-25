-- Fix Security Definer Views by recreating them with security_invoker option
-- This ensures views run with the calling user's permissions, not the view creator's

-- Drop existing views
DROP VIEW IF EXISTS public.ad_performance_reports;
DROP VIEW IF EXISTS public.daily_ad_reports;

-- Recreate ad_performance_reports with security_invoker
CREATE VIEW public.ad_performance_reports
WITH (security_invoker = true)
AS
SELECT 
  av.ad_id,
  ads.name AS ad_name,
  av.ad_position,
  av.page_section,
  av.slot_id,
  COUNT(DISTINCT av.id) AS impressions,
  COUNT(DISTINCT ac.id) AS clicks,
  CASE 
    WHEN COUNT(DISTINCT av.id) > 0 
    THEN (COUNT(DISTINCT ac.id)::float / COUNT(DISTINCT av.id)::float) * 100 
    ELSE 0 
  END AS ctr
FROM ad_views av
LEFT JOIN ad_clicks ac ON av.ad_id = ac.ad_id 
  AND av.session_id = ac.session_id
LEFT JOIN ad_slots ads ON av.ad_id = ads.id
GROUP BY av.ad_id, ads.name, av.ad_position, av.page_section, av.slot_id;

-- Recreate daily_ad_reports with security_invoker
CREATE VIEW public.daily_ad_reports
WITH (security_invoker = true)
AS
SELECT 
  av.ad_id,
  av.ad_position,
  DATE(av.view_date) AS report_date,
  COUNT(av.id) AS impressions,
  COUNT(DISTINCT av.session_id) AS unique_views
FROM ad_views av
GROUP BY av.ad_id, av.ad_position, DATE(av.view_date);