GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Backfill total points from monthly_points sum for users whose profile points lag behind
UPDATE public.profiles p
SET points = COALESCE(sub.total, 0)
FROM (
  SELECT user_id, SUM(points) AS total
  FROM public.monthly_points
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id
  AND (p.points IS NULL OR p.points < sub.total);