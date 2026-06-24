# Keep mobile web visitors engaged (reduce bounce rate)

## Goal
Real mobile-web visitors land on a single SEO page (a quiz question, `/all-questions`, `/stories`) and leave immediately — a "dead-end" landing. We will turn each landing page into the start of a continuous, app-like session so visitors keep playing, **without** a forced login wall and **without** breaking SEO.

> Note: ~90% of the current 95% bounce is sub-second China/Direct/mobile traffic that is almost certainly bots — no UI change affects bots. This plan targets the genuine US/IN/organic mobile segment. As agreed, we are not touching bot filtering here.

## What we will build

### 1. Continuous "keep playing" flow on the SEO question pages
Today a visitor who lands on `/quiz/question/:id/...` answers once and hits a dead end.
- After the answer is revealed, auto-surface a prominent **"Next question →"** card (and a short auto-advance countdown, matching the existing 5s auto-advance pattern used elsewhere).
- The next question loads in-place (client-side), so one landing becomes a multi-question session — directly lifting pages/session and visit duration.
- Keep the canonical SEO URL/meta for the originally landed question; subsequent questions advance via client routing.

### 2. App-like persistent mobile bottom navigation everywhere
- Ensure the existing `MobileBottomNav` (Home / Categories / Play / Leaderboard / Profile-or-Login) renders on every mobile web page a visitor can land on — especially `/quiz/question/...`, `/all-questions`, `/stories`, `/categories/...`. This gives a clear next tap instead of the browser back button.
- Add comfortable bottom padding so content never hides behind the nav.

### 3. Soft login (play first, prompt later) — no wall
- Keep the current guest model: guests can play (existing 30/day guest allowance) with no login required on arrival.
- Replace any abrupt prompts with a **non-blocking** registration nudge: a dismissible bottom sheet that appears only after the visitor has answered several questions (reuse the existing `RegistrationIncentiveModal` "after N questions" trigger), framed around saving gems/streak. Dismiss = keep playing.

### 4. App-like polish on mobile web
- Smooth page/question transitions (fade/slide) so navigation feels native, not like full page reloads.
- Immediate tap feedback on answer options and the "Next" CTA.
- Make sure the landing question is instantly interactive (no spinner gate) on the SEO pages.

### 5. Light-touch engagement hooks on landing
- On the quiz question landing page, show a compact gems/streak indicator and a one-line "answer X in a row" hook to create a goal in the first few seconds.

## Explicitly out of scope
- Routing mobile web users into the Capacitor `AppMobile` story UI (rejected — it forces login and loses SEO context).
- Any forced login/registration before play.
- Bot/China traffic filtering.

## Will it actually help?
Yes, for real users. The biggest bounce driver here is structural: every SEO entry point is a single-action dead end. Adding an immediate, frictionless "next question" loop plus persistent navigation is the highest-leverage change for pages/session, visit duration, and ad impressions — and it compounds with the soft-login nudge converting engaged guests into return visitors. The app-like polish reinforces the feel but the flow/nav changes carry most of the impact.

## Technical notes (for implementation)
- Primary files: `src/pages/QuizQuestionPage.tsx` / `QuizPlayPage.tsx` (auto-advance + next-question loop), `src/components/home/MobileBottomNav.tsx` and the shared `PageLayout` (render nav on all landing routes), `src/components/home/RegistrationIncentiveModal.tsx` (soft, dismissible, delayed), `src/utils/guestPlayService.ts` (already supports guest play — reuse, no wall).
- Reuse existing patterns: 5s auto-advance, guest play counter, registration-after-N-questions trigger.
- All changes are frontend/presentation only; no schema or backend changes. SEO meta/canonical on landing pages stays intact.
