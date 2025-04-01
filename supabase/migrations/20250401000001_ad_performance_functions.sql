
-- Create function to get ad view counts grouped by ad_id, ad_position, slot_id, and page_section
CREATE OR REPLACE FUNCTION public.get_ad_impressions_count()
RETURNS TABLE (
  ad_id UUID,
  ad_position TEXT,
  slot_id TEXT,
  page_section TEXT,
  count TEXT
) 
LANGUAGE sql
AS $$
  SELECT 
    ad_id,
    ad_position,
    slot_id,
    page_section,
    COUNT(*)::TEXT as count
  FROM 
    ad_views
  GROUP BY 
    ad_id,
    ad_position,
    slot_id,
    page_section;
$$;

-- Create function to get ad click counts grouped by ad_id, ad_position, slot_id, and page_section
CREATE OR REPLACE FUNCTION public.get_ad_clicks_count()
RETURNS TABLE (
  ad_id UUID,
  ad_position TEXT,
  slot_id TEXT,
  page_section TEXT,
  count TEXT
) 
LANGUAGE sql
AS $$
  SELECT 
    ad_id,
    ad_position,
    slot_id,
    page_section,
    COUNT(*)::TEXT as count
  FROM 
    ad_clicks
  GROUP BY 
    ad_id,
    ad_position,
    slot_id,
    page_section;
$$;
