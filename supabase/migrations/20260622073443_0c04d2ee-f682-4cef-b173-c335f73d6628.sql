CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(_month text DEFAULT to_char(now(), 'YYYY-MM'), _limit int DEFAULT 50)
RETURNS TABLE (user_id text, username text, display_name text, profile_picture text, points numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.user_id, p.username, p.display_name, p.profile_picture, mp.points
  FROM public.monthly_points mp
  LEFT JOIN public.profiles p ON p.id = mp.user_id
  WHERE mp.month = _month
  ORDER BY mp.points DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_leaderboard(text, int) TO anon, authenticated, service_role;