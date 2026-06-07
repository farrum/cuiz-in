# Track Anonymous / Guest Activity

## Goal
Right now guest activity lives only in the browser's localStorage, so anonymous visitors (like the Singapore traffic) never appear anywhere you can see. This adds server-side logging of guest behavior and a new admin dashboard tab to view it.

## What gets tracked
1. **Page views** — which quiz/question pages anonymous visitors open, with timestamp.
2. **Questions answered** — each guest quiz answer: question, correct/wrong, points earned.
3. **Session info** — country/region, device type, referrer, derived from the request (IP-based country, never stored as raw PII beyond a hashed session id).
4. **Conversion funnel** — when a guest hits the free-play limit and whether they later registered.

All events are tied to an anonymous `session_id` (already generated client-side), not to a real user.

## How it works

### 1. Database (new table `guest_events`)
A single events table storing one row per tracked action:
- `session_id`, `event_type` (`page_view` | `answer` | `limit_reached` | `registered`)
- `path`, `question_id`, `correct`, `points`, `country`, `device`, `referrer`
- standard `id` / `created_at`

Because guests are not authenticated, rows are **only** inserted through a server-side edge function (using the service role). RLS will allow **admins to read** and **block all client writes** — no `anon` insert grant, so the table can't be spammed directly from the browser.

### 2. Edge function `track-guest-event`
- Public endpoint (no JWT). Accepts a batch of events `{ session_id, event_type, ... }`.
- Derives `country` from Cloudflare/Supabase request headers and `device` from the user-agent server-side (more reliable than client claims).
- Validates input with a strict schema and inserts via service role.
- Lightweight, fire-and-forget (failures never block the UI).

### 3. Client logging
A small `guestAnalytics.ts` helper that calls the edge function. Hooks added at existing guest touch-points only (no new UI for visitors):
- **Page view**: on quiz/question/answer page load when the visitor is not logged in.
- **Answer**: in `QuizCard` / `EnhancedQuizCard` where guest plays are already counted (`incrementGuestPlay`).
- **Limit reached**: where `GuestPlayLimitModal` opens.
- **Registered**: on successful registration, send a `registered` event with the same `session_id` to close the funnel.

The persistent `session_id` is stored in localStorage so all events from one visitor link together.

### 4. Admin dashboard (new "Guests" tab)
A new tab in `AdminPage.tsx` with a `GuestActivityPanel` component showing:
- Top stat cards: total guest sessions, page views, questions answered, limit-reached count, conversions (and conversion rate).
- Breakdown by country and by device.
- Recent guest events table (latest activity).
- A date-range selector (last 24h / 7d / 30d).

Data is read directly from `guest_events` via the admin's authenticated session (RLS admin-read policy).

## Technical notes
- New table: `public.guest_events` with GRANTs (`SELECT` to authenticated for admin-read policy, `ALL` to service_role; no anon grant).
- New edge function: `supabase/functions/track-guest-event/index.ts` (verify_jwt false, input-validated, service-role insert).
- New files: `src/utils/guestAnalytics.ts`, `src/components/admin/GuestActivityPanel.tsx`.
- Edited: `AdminPage.tsx` (tab), `QuizCard.tsx` / `EnhancedQuizCard.tsx` (answer + limit events), quiz/answer pages (page-view event), registration flow (conversion event).
- No money/points-economy changes; tracking only. Defensive: all logging is best-effort and never blocks gameplay.

## Out of scope
- Blocking/bot-filtering scraper traffic (separate task).
- Any visible UI change for guests themselves.
