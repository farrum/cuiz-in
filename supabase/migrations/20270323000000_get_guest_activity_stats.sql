-- Create RPC function to get guest activity statistics for admin dashboard without caps
CREATE OR REPLACE FUNCTION public.get_guest_activity_stats(since_date timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions bigint;
  v_page_views bigint;
  v_answers bigint;
  v_limit_reached bigint;
  v_conversions bigint;
  v_countries jsonb;
  v_devices jsonb;
BEGIN
  -- Check if the current user is an admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  -- 1. Count of unique sessions
  SELECT COUNT(DISTINCT session_id) INTO v_sessions
  FROM guest_events
  WHERE created_at >= since_date;

  -- 2. Count of page views
  SELECT COUNT(*) INTO v_page_views
  FROM guest_events
  WHERE created_at >= since_date AND event_type = 'page_view';

  -- 3. Count of answers
  SELECT COUNT(*) INTO v_answers
  FROM guest_events
  WHERE created_at >= since_date AND event_type = 'answer';

  -- 4. Count of hit free limit
  SELECT COUNT(*) INTO v_limit_reached
  FROM guest_events
  WHERE created_at >= since_date AND event_type = 'limit_reached';

  -- 5. Count of conversions
  SELECT COUNT(*) INTO v_conversions
  FROM guest_events
  WHERE created_at >= since_date AND event_type = 'registered';

  -- 6. Country distribution (top 8)
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_countries
  FROM (
    SELECT jsonb_build_array(COALESCE(country, 'unknown'), COUNT(*)) as elem
    FROM guest_events
    WHERE created_at >= since_date
    GROUP BY COALESCE(country, 'unknown')
    ORDER BY COUNT(*) DESC
    LIMIT 8
  ) t;

  -- 7. Device distribution
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_devices
  FROM (
    SELECT jsonb_build_array(COALESCE(device, 'unknown'), COUNT(*)) as elem
    FROM guest_events
    WHERE created_at >= since_date
    GROUP BY COALESCE(device, 'unknown')
    ORDER BY COUNT(*) DESC    
  ) t;

  RETURN jsonb_build_object(
    'sessions', v_sessions,
    'page_views', v_page_views,
    'answers', v_answers,
    'limit_reached', v_limit_reached,
    'registered', v_conversions,
    'top_countries', v_countries,
    'top_devices', v_devices
  );
END;
$$;
