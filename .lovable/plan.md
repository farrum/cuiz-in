# Ad revenue overhaul — Mode 2 + AdSense Auto Ads + Interstitial

## Goals
1. Each question = its own URL (new pageview = new ad auction)
2. Enable AdSense Auto Ads (publisher `ca-pub-2831295465597549` already verified in `index.html`)
3. Show a skippable interstitial ad after every 2 answered questions (5s countdown)
4. Keep server-side `validate-quiz-answer` as the only correctness check
5. Stay AdSense-policy-safe (no surprise full-screen, no excessive refresh, no thin pages)

---

## Part 1 — Migrate `/quiz` to URL-per-question (Mode 2)

**Current flow:** `/quiz` mounts `QuizPage`, which uses `useQuizState` → `loadNewQuestion()` swaps question via React state. No URL change, no new pageview.

**New flow:**
- `/quiz` becomes a lightweight redirector: picks a random unanswered question, navigates to `/quiz/play/:questionId/:slug`
- New page `QuizPlayPage` (separate from the existing SEO-focused `QuizQuestionPage` at `/quiz/question/...`) handles the active play loop. On answer submit → show explanation + interstitial gate → navigate to next `/quiz/play/:newId/:newSlug`
- Keep `/quiz/question/...` unchanged — that route is for SEO/landing traffic with rich schema and stays the indexable canonical
- The "Play" page sets `<meta name="robots" content="noindex">` to avoid duplicate-content issues with the SEO page; canonical points to `/quiz/question/...` for the same question
- Streak, points, daily counter, guest limit all keep working — state is persisted in `usePersistentQuizStats` (localStorage) and re-read on the next route mount

**Server-side validation stays as-is.** `QuizPlayPage` calls the same `validate-quiz-answer` edge function before counting points / advancing.

**Why a separate Play route instead of refreshing `/quiz`:**
- True new URL = new GPT/AdSense auction (the whole point)
- React Router navigation already triggers AdSense Auto Ads page-change signal
- Avoids breaking the existing SEO route

## Part 2 — Enable AdSense Auto Ads safely

**Current state:** AdSense script is loaded in `index.html` (line 231) but Auto Ads is not activated. The existing in-app `SimpleAdBanner` returns placeholders (`useSimpleAd.ts` is stubbed for security).

**Changes:**
1. Add the Auto Ads activation snippet to `index.html` head:
   ```html
   <script>
     (adsbygoogle = window.adsbygoogle || []).push({
       google_ad_client: "ca-pub-2831295465597549",
       enable_page_level_ads: true,
       overlays: { bottom: true }
     });
   </script>
   ```
2. In AdSense dashboard (user action — I'll provide a checklist): enable Auto Ads with these formats: In-page, Anchor (sticky bottom), Side rail. Disable Vignette to avoid full-screen interrupts conflicting with our interstitial.
3. Reserve CSS space for the bottom anchor (~60px) by padding `body` so the anchor doesn't cover the "Next" button — add `body { padding-bottom: 60px; }` and a class to opt out on admin pages.
4. Remove or null-render the old `SimpleAdBanner` instances on `/quiz` (top / middle / bottom slots) — Auto Ads will place fills automatically and we avoid double-loading. Keep `SimpleAdBanner` file/component for now (other pages reference it), but the function returns null until further notice. Already mostly the case.

## Part 3 — Skippable interstitial after every 2 questions

**New component** `src/components/quiz/QuizInterstitial.tsx`:
- Full-card (not full-screen) ad slot rendered in-place where the question normally is
- AdSense **fixed display ad unit** (responsive, 336x280 / 300x250) — create one unit in AdSense dashboard, paste its slot id into an env-ish constant
- 5-second countdown shown in the "Skip" button (`Skip in 5s` → `Skip in 4s` → ... → enabled `Skip → Next Question`)
- Auto-skip when countdown hits 0 (UX safety so people aren't blocked)
- Reserves min-height (`min-h-[300px]`) to keep CLS = 0

**Trigger logic in `QuizPlayPage`:**
- After explanation phase, check `questionsAnsweredThisSession % 2 === 0 && questionsAnsweredThisSession > 0`
- Show `<QuizInterstitial onDone={goToNextQuestion} />`
- First 2 questions of a fresh session never show interstitial (warm-up; better UX, better engagement metrics → better AdSense placement)
- Logged-out (guest) users also get interstitial — actually higher CPM since guests are top-of-funnel
- Track count in `sessionStorage` so refresh doesn't reset and let users skip the rotation

## Part 4 — Pitfalls + guardrails baked in

| Risk | Mitigation in the build |
|---|---|
| AdSense interstitial policy strike | Visible skip button from t=0, auto-skip at 5s, never on first question, no overlay over content |
| CLS hurting Core Web Vitals → lower CPM | Fixed `min-height` on interstitial container and on Auto-Ads anchor padding |
| Same ad shown repeatedly because SPA | Each question is its own URL — Auto Ads sees a real page transition; for the interstitial we use a `key={questionId}` remount so AdSense re-pushes the slot |
| Refresh-too-fast invalid traffic flag | Min ~15s gap enforced (the answer + explanation + 5s countdown already covers it); no programmatic `pubads().refresh` calls |
| Bots inflating impressions → AdSense ban | Keep server-side `validate-quiz-answer`; add a lightweight `sessionStorage` "human signal" (any click within 30s of page load) before rendering the interstitial slot |
| Thin-content penalty on play URLs | Play route is `noindex`; SEO traffic still lands on the rich `/quiz/question/...` page |
| Bottom anchor covering "Next" button on mobile | Global `padding-bottom: 60px` on `body` so the sticky anchor doesn't overlap CTAs |
| Old `SimpleAdBanner` re-introducing arbitrary scripts | Already stubbed; leave stubbed. Auto Ads is the only ad path |
| AdSense Auto Ads placing ads inside the question card | Add `data-no-auto-ads="true"` on the active question card wrapper (AdSense respects `data-ad-region` exclusions when configured) |

## Part 5 — Files to create / change

**Create:**
- `src/pages/QuizPlayPage.tsx` — the per-URL play page
- `src/components/quiz/QuizInterstitial.tsx` — the 5s skippable AdSense card
- `src/components/ads/AdSenseUnit.tsx` — thin safe wrapper around `<ins class="adsbygoogle">` that pushes on mount with `key` remount support

**Edit:**
- `index.html` — add Auto Ads activation snippet + body padding for anchor
- `src/App.tsx` — register `/quiz/play/:questionId/:slug` route
- `src/pages/QuizPage.tsx` — convert to a redirector (pick random question, navigate). Or keep landing UI and add a "Start playing" CTA that navigates — preferred for SEO since `/quiz` already ranks
- `src/hooks/quiz/useQuizQuestion.ts` — add helper `getNextRandomQuestionId()` used for the redirect
- `src/components/quiz/QuizContent.tsx` — unchanged, reused inside `QuizPlayPage`
- `src/index.css` — `body { padding-bottom: 60px; }` (with admin opt-out)

**No DB changes required.** `validate-quiz-answer` edge function unchanged. RLS unchanged.

## Part 6 — Rollout / verification
1. Ship the route + redirector + interstitial behind no flag (low risk; isolated to new route)
2. Verify in preview: answer 4 questions, confirm URL changes each time, interstitial fires on questions 2 and 4, skip works, auto-skip works
3. After deploy, in AdSense dashboard enable Auto Ads + create the display unit for the interstitial
4. Monitor AdSense "Policy center" for 48h — if any "Better Ads Standards" warning, raise interstitial cadence to every 3 questions

## Out of scope (can do later if you want)
- GAM / header bidding integration (only worth it past ~50k pageviews/day)
- Rewarded ads ("watch ad for +5 points")
- A/B testing interstitial cadence (every 2 vs every 3)

---

Approve this plan and I'll implement Parts 1–5 in one pass. The AdSense dashboard toggles in Part 2 / Part 3 require you to log into your AdSense account; I'll give you a step-by-step checklist when the code is in.
