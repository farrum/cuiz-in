CREATE OR REPLACE FUNCTION public.record_my_attendance()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text;
  v_username text;
  v_today date;
BEGIN
  v_uid := auth.uid()::text;
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = v_uid;
  IF v_username IS NULL THEN
    RETURN false;
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;

  INSERT INTO public.user_attendance (user_id, username, attendance_date, login_time)
  VALUES (v_uid, v_username, v_today, now())
  ON CONFLICT (user_id, attendance_date) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_my_attendance() TO authenticated;

-- Backfill attendance days from historical quiz activity
INSERT INTO public.user_attendance (user_id, username, attendance_date, login_time)
SELECT q.user_id,
       p.username,
       (q.created_at AT TIME ZONE 'Asia/Kolkata')::date AS d,
       min(q.created_at)
FROM public.quiz_answers q
JOIN public.profiles p ON p.id = q.user_id
GROUP BY q.user_id, p.username, (q.created_at AT TIME ZONE 'Asia/Kolkata')::date
ON CONFLICT (user_id, attendance_date) DO NOTHING;

-- Backfill signup day so brand-new players are not blank
INSERT INTO public.user_attendance (user_id, username, attendance_date, login_time)
SELECT p.id, p.username, (p.created_at AT TIME ZONE 'Asia/Kolkata')::date, p.created_at
FROM public.profiles p
WHERE p.created_at IS NOT NULL
ON CONFLICT (user_id, attendance_date) DO NOTHING;