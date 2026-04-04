
-- Step 1: Add SELECT policies for regular users on daily_points and monthly_points

CREATE POLICY "Users can read their own daily points"
ON public.daily_points FOR SELECT
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can read their own monthly points"
ON public.monthly_points FOR SELECT
USING (user_id = (auth.uid())::text);
