ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_platform text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.record_session_platform(p_platform text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user text;
  v_platform text;
BEGIN
  v_user := public.get_current_user_id();
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  v_platform := lower(coalesce(p_platform, 'web'));
  IF v_platform NOT IN ('android', 'ios', 'web') THEN
    v_platform := 'web';
  END IF;

  UPDATE public.profiles
     SET last_platform = v_platform,
         last_seen_at = now()
   WHERE id = v_user;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_session_platform(text) TO authenticated;