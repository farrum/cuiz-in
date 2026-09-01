# Fix "Questions Today" reporting in Admin User Directory

## What the data actually shows

Checked live data for today (Asia/Kolkata):

- The per-user counts the panel shows do match `quiz_answers` for today (e.g. Roushan1234 = 20, Gautam = 144 vs 135 shown — the screenshot was simply a few minutes stale).
- Users who "have gems but 0 questions today" are not a counting bug: the **Gems column shows lifetime points, not today's points**. Khan@123 has 21 lifetime gems but zero answers today; the many users with 1 gem got that from the signup bonus.
- Some of today's gems do not come from quiz answers at all (wheel spins, scratch cards, tribute/streak bonuses) — e.g. Roushan1234 earned 77 gems today but only 27 from quiz answers.
- The count deliberately **excludes daily-challenge / quest questions**, so quest-only play shows as 0.
- The list has no auto refresh, so numbers age while the admin looks at the page.

So the number isn't wrong so much as incomplete and misleading next to a lifetime gems column.

## Changes

1. **Split the gems column**: show "Gems Today" (from `daily_points` for the India-time date) next to lifetime gems, so an admin can see who actually played today.
2. **Report all questions attempted today**, not just non-challenge ones: show total attempts today, with challenge/quest attempts broken out (tooltip or a second small number, e.g. `20 (+4 quest)`).
3. **Single source of truth**: drop the duplicate client-side RPC call in `AdminUserManagementEnhanced.tsx` and rely on the values returned by the `admin-get-users` edge function, so a permission or network hiccup can't silently zero the column.
4. **Freshness**: add a visible "last updated" timestamp and a refresh button (with optional 60s auto refresh) on the user directory.

## Technical notes

- New RPC `admin_get_user_activity_today()` (SECURITY DEFINER, admin-checked) returning `user_id, questions_total, questions_quest, gems_today` computed over the Asia/Kolkata day boundary from `quiz_answers` and `daily_points`. Replaces/supersedes `admin_get_questions_today`.
- `supabase/functions/admin-get-users/index.ts`: call the new RPC, map `questions_today`, `questions_quest_today`, `gems_today` onto each user.
- `src/components/admin/AdminUserManagementEnhanced.tsx`: remove the client RPC block, add the Gems Today column, quest breakdown, refresh control and timestamp.
- No changes to how gems are awarded or how answers are recorded.
