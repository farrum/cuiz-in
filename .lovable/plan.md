

## Fix: Daily and Monthly Points Not Calculating

### Root Cause

The recent security hardening broke points for all users. Two problems:

**1. No SELECT policy for regular users on `daily_points` and `monthly_points`**

The RLS policies on both tables only allow admin SELECT (via `is_current_user_admin()`). Regular users have INSERT and UPDATE but cannot READ their own records. This means:
- `logPointsForDay()` calls `SELECT points FROM daily_points WHERE user_id = ...` -- fails silently (returns no rows)
- So it always thinks there's no existing record and tries INSERT instead of UPDATE
- `fetchPoints()` in `useQuizPoints.ts` also can't read daily/monthly points -- always shows 0

**2. Legacy auth users have NULL `auth.uid()`**

The INSERT/UPDATE policies use `user_id = get_current_user_id() OR user_id = (auth.uid())::text`. Since `get_current_user_id()` now strictly returns `auth.uid()` (per security hardening), legacy users who aren't signed in via Supabase Auth get NULL for both checks, so all writes fail too.

### Additional Issue Found

The console logs also show `quiz_questions` INSERT is blocked by RLS for the admin -- the admin user's `auth.uid()` doesn't match the `user_roles` check (likely using legacy admin login). This is why the "Learn Trivia" feature can't save questions.

### Fix Plan

**Step 1: Add SELECT policies for users on `daily_points` and `monthly_points`**

Migration to add:
```sql
-- Users can read their own daily points
CREATE POLICY "Users can read their own daily points"
ON public.daily_points FOR SELECT
USING (user_id = (auth.uid())::text);

-- Users can read their own monthly points
CREATE POLICY "Users can read their own monthly points"
ON public.monthly_points FOR SELECT
USING (user_id = (auth.uid())::text);
```

**Step 2: Fix `pointsService.ts` to use `.maybeSingle()` instead of `.single()`**

The `logPointsForDay` and `logPointsForMonth` functions use `.single()` which throws errors when no row exists. Change to `.maybeSingle()` (matching the established defensive coding pattern).

**Step 3: Fix admin quiz question INSERT**

The `quiz_questions` admin policy checks `user_roles.user_id = (auth.uid())::text`. Since the admin uses legacy login (not Supabase Auth), `auth.uid()` is NULL. Either:
- Route quiz question creation through an Edge Function (like other admin operations), OR
- Add a service-role based trivia save function

I recommend routing through an Edge Function for consistency with the existing admin pattern.

### Files to Change

1. **New migration** -- Add SELECT policies on `daily_points` and `monthly_points`
2. **`src/utils/pointsService.ts`** -- Replace `.single()` with `.maybeSingle()` in `logPointsForDay` and `logPointsForMonth`
3. **`supabase/functions/` (new)** -- Create edge function for admin quiz question creation, OR update `triviaFetcher.ts` to call an existing admin edge function

