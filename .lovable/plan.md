
# Why bounce rate is 99% — and what to actually fix

## What the data proves

Pulled real engagement numbers from the DB for the last 7 days, against the same 7-day analytics window (10,572 visits):

| Signal (last 7 days) | Count |
|---|---|
| Page visits (analytics) | 10,572 |
| Distinct users who answered ANY quiz | **4** |
| Total quiz answers | 54 |
| New signups | 4 |
| Distinct logged-in users | 13 |

Engagement rate: **~0.04%**. The 99% bounce rate is not a measurement glitch — it's real.

## Two distinct problems, not one

### Problem 1 — Bot/scraper traffic is inflating the denominator

- 7,852 of 10,572 visits (74%) are from **CN, Direct, 100% bounce, mobile**. Classic scraper signature.
- Only 6 visits in 7 days came from Google. Your "traffic" is overwhelmingly bots crawling the sitemap.
- This is not "wrong audience" — these aren't people at all. They will never click anything.

### Problem 2 — Real users land on a dead-end

- 9 of your top 10 pages are individual SEO question pages (`/quiz/question/:id/...`).
- Reading `QuizQuestionPage.tsx`: when a user answers, `handleQuizComplete` redirects them to `/answer/:id/:slug` — a **static answer page**, not the next question.
- So even an engaged visitor: lands → answers ONCE → gets sent to a different URL that doesn't continue the game → leaves. That's a 2-pageview session at best, and the answer page isn't designed to pull them back into play.
- The homepage `Index.tsx` is heavy (hero + try-section + streak + referral + daily rewards + categories + articles + testimonials + 3 ad placeholders + CTA) — a lot of scrolling before the user is invited to actually play.

## Plan — in priority order

### Phase 1 — Stop counting bots as users (measurement fix)

Without this, you can't tell if anything else is working.

1. **Filter analytics by country + traffic source.** Look at metrics excluding CN+Direct. Real US/IN traffic engagement is the only number that matters.
2. **Add lightweight bot detection** on the client (User-Agent check + headless browser hints) and tag those sessions so they're either not tracked or tagged as `bot=true`. Compare clean numbers vs. raw.
3. **Tighten the sitemap response** for scraper-prone endpoints: rate-limit or require a real referrer for `/quiz/question/...` JSON-style fetches if any exist. (Don't block crawlers from Google — only obvious abuse.)

Deliverable: a clear "real human" baseline bounce rate. Hypothesis: real bounce is closer to 65–80%, still high but normal.

### Phase 2 — Fix the #1 engagement leak: SEO question pages

This is where almost all real human entry happens.

1. **After answer on `/quiz/question/:id`, do NOT redirect to `/answer/...`.** Instead, reveal the answer + explanation inline and show a prominent **"Next Question →"** button that loads another question in place (same URL pattern, but new question).
2. **Auto-advance after 5 seconds** of showing the answer (same pattern used in `QuizPlayPage`).
3. **Remove or de-emphasize the SEO bulking blocks below the question** for first-time visitors — they push the next-question CTA below the fold on mobile. Keep them for SEO crawlers but lazy-render after scroll.
4. **Add a "questions answered in this session" badge** at the top to create momentum (you already have `CompactStatsBar` — reuse it).

Expected impact: 1 → 5–10 pageviews per real session. Bounce on these pages drops sharply.

### Phase 3 — Homepage: get to a question in one tap

1. **Hoist `TryQuestionSection` into the hero.** First fold = a live question, not marketing copy.
2. **Defer testimonials, articles, category previews, and ad placeholders below the fold**, lazy-load on scroll.
3. **Remove the registration modal trigger before 5 questions answered** (currently triggers after 3 — too aggressive for cold traffic).

### Phase 4 — Re-measure

After Phase 2 ships, give it 3–4 days. Compare:
- Real-human bounce rate (CN+Direct excluded)
- Pageviews per visit
- Quiz answers per day (DB count, the only ground-truth metric)

If quiz-answers-per-day jumps from ~8/day to 50+/day, the fix worked. If not, the real audience problem is acquisition, not engagement, and we shift to SEO/content strategy.

## What this plan does NOT include

- No paid-acquisition or SEO content work — out of scope until we know the existing funnel converts.
- No re-architecture of the auth flow or quiz engine — the leak is presentational.
- No changes to scoring, gems, or competition logic.

## Technical notes

- `QuizQuestionPage.tsx` `handleQuizComplete` (line 187) is the redirect to fix.
- `getRandomQuestion` (already used in `QuizPlayPage`) can be reused to load the next question inline.
- Bot detection: simple — check `navigator.webdriver`, missing `Accept-Language`, CN ASN can be inferred server-side. We can use a lightweight edge function or just tag in the analytics call.
- Analytics filtering: Lovable Analytics doesn't let you filter on country in the dashboard, so we'd add a custom `bot_filtered=true` tag and look at our own DB-derived metrics as the source of truth.

## Approve to proceed

If this plan looks right, I'll start with **Phase 2 (fix the question-page dead-end)** because it's the highest-leverage, lowest-risk change and gives us a fast read on whether engagement is fixable through UX or whether the bottleneck is purely audience acquisition.
