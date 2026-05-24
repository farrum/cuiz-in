## Goal

Replace the hardcoded "50 gems" scratch card with a weighted random prize, enforced server-side, applied everywhere scratch cards appear (homepage daily reward + post-quiz surprise).

## Prize table

| Prize | Probability |
|---|---|
| Better luck next time (0) | 30% |
| 1 gem | 30% |
| 2 gems | 20% |
| 5 gems | 10% |
| 10 gems | 4% |
| 15 gems | 3% |
| 25 gems | 2% |
| 50 gems | 1% |

## Backend (migration)

1. Insert a `scratch_prizes` config row into `gamification_settings` with the 8 prizes (`id`, `label`, `value`, `probability`).
2. Create table `scratch_card_plays` (`id`, `user_id text`, `context text` — `'daily'` or `'quiz'`, `prize_id`, `prize_label`, `prize_value`, `played_on date`, `created_at`). RLS: users see/insert own, admins manage.
3. Add a partial UNIQUE index on `(user_id, played_on) WHERE context = 'daily'` so only one daily card per user per day (quiz cards unlimited).
4. Create RPC `process_scratch_card(p_context text)`:
   - Requires `auth.uid()`.
   - If `p_context = 'daily'`, reject if already played today.
   - Loads prizes from `gamification_settings`, picks one weighted by `probability`.
   - Credits `profiles.gems_balance` when `value > 0`.
   - Inserts row in `scratch_card_plays`.
   - Returns `{ id, label, value }`.
   - Grant EXECUTE to `authenticated`.

## Frontend

1. **`ScratchCard.tsx`** — add optional `prize` prop (`{ label, value }`) and a `loading` state; keep existing cover/scratch animation untouched.
2. **`DailyRewardsSection.tsx`** — on tab open (or component mount), call `process_scratch_card('daily')`, store result. If RPC returns "already played today", show a friendly "Come back tomorrow" state instead of the card. Render returned `label`/`value` under the cover. Remove the hardcoded "50 Gems".
3. **`QuizPlayPage.tsx`** — replace the local `Math.floor(Math.random()*50)+10` and the client-side `gems_balance` update with a call to `process_scratch_card('quiz')`. Display the returned prize; gems are already credited by the RPC, so delete the client-side update block.

## Out of scope

- Scratch animation, layout, and styling stay as-is.
- No new UI for prize history.

## Approval

If approved, I'll write the migration first (one tool call), wait for your confirmation, then update the three frontend files.