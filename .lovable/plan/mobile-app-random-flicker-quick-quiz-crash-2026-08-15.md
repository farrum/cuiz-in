# Mobile app: random flicker + Quick Quiz crash

Deep dive results. Two separate root causes, both confirmed by reading the ad and quiz code paths.

## Why the app flickers (and gets worse with usage)

**The native banner is torn down and re-requested on every screen change.**
`TopBannerAd` is mounted in five places: the shell (`MobileShell`) and again inside Quiz, MiniGame, Login and Onboarding screens. On native it renders `NativeBannerAd`, whose mount calls `showAdMobBanner()` and whose unmount calls `hideAdMobBanner()`.

React unmounts the old screen before mounting the new one, so navigating Hub -> Quick Quiz runs:

```text
shell banner unmount  -> refCount 1 -> 0 -> AdMob.removeBanner()
quiz banner mount     -> refCount 0 -> 1 -> AdMob.showBanner()
```

The native banner physically disappears and a brand-new ad request is made on every navigation — that is the visible flash and the layout jump above the tab bar.

**The ref-count drifts.** `showAdMobBanner()` increments the counter *before* it knows whether AdMob initialised, and still increments when it fails over to the LevelPlay banner. `hideAdMobBanner()` always decrements. Over a session the counter drifts away from the real number of mounted banners, so `removeBanner()` either fires while a banner should stay, or never fires and a second `showBanner()` stacks another banner surface on top. This is exactly the "worse after some usage" pattern.

**Secondary flicker sources**
- `MobileShell` keys its animated wrapper by pathname, remounting the whole screen subtree on each route change while the fade runs.
- On web, `TopBannerAd` swaps the house creative every 30s and `SimpleAdBanner` runs its own refresh.
- Long-lived intervals (`scheduledSync`, `accountStatusService`, `useQuizGems` 60s, monthly-reset check) keep pushing state updates; some are started per screen mount and accumulate over a session, adding re-render churn on top.

## Why Quick Quiz crashes

**1. The fallback question loader can pull 1,500 rows and re-serialise them into localStorage.**
`getRandomQuestion()` samples a 30-row page (the earlier fix). But when that sample comes back empty — a network blip, an RLS/`count` error, or an `image` question-type filter with no rows in range — it falls straight through to `fetchQuizQuestions()`, which selects 1,500 questions and does `JSON.stringify` of the whole array into localStorage. On a mid-range Android WebView that is a multi-megabyte allocation plus a long main-thread stall, repeated on every question. That is a hard crash / ANR, not a React error.

**2. Interstitial pressure.** Quick Quiz shows a full-screen ad every 2nd answer, and `showAdWithFallback` can attempt up to four SDK surfaces in sequence (AdMob interstitial -> AdMob rewarded-interstitial -> LevelPlay interstitial -> LevelPlay rewarded), each preparing and warming another ad, while a banner is also live. Combined native ad memory is the most likely trigger for "crashes after some usage".

**3. Nothing local catches it.** `/quiz` sits outside `MobileShell`, so it has no per-screen error boundary — only the app-level one, which blanks the entire app when it trips.

## What I will change

1. **One banner, owned by the app, never remounted.** Move the native banner out of the component tree into a single app-level controller mounted once in `AppMobile`. Screens declare "banner visible / hidden" instead of mounting their own instance, so navigation never removes and re-requests the ad.
2. **Fix the ref-count.** Increment only after a banner is actually shown, never on the LevelPlay fallback path, and make show/hide idempotent so drift cannot accumulate.
3. **Remove the 1,500-row fallback from the quiz path.** If the sampled page is empty, retry the sample once (or drop the restrictive filter), then fall back to the small cached pool — never re-fetch and re-serialise the whole bank. Also stop rewriting the localStorage question cache on the hot path.
4. **Throttle interstitials.** Cap the waterfall at two surfaces, add a minimum interval between full-screen ads, and skip the interstitial entirely when the previous one failed to fill.
5. **Wrap `/quiz` (and `/daily`, `/game/:gameId`) in their own error boundary** so a screen-level failure shows a Retry card instead of blanking the app.
6. **Reduce render churn**: stop keying the shell wrapper by pathname (cross-fade without remount), and make the 60s gem/status intervals singletons instead of per-mount.
7. **Add crash telemetry**: a global `error` + `unhandledrejection` logger so the next real crash reports its actual cause instead of a white screen.

## Technical notes

- `src/mobile/ads/admob.ts` — correct `bannerRefCount` accounting; add `isBannerShown` guard.
- `src/mobile/ads/NativeBannerAd.tsx` / `TopBannerAd.tsx` — become presentational; native banner lifecycle moves to a new `src/mobile/ads/BannerHost.tsx` mounted once in `AppMobile`.
- `src/utils/quizDataService.ts` — `getRandomQuestion` no longer calls `fetchQuizQuestions()`; retry-sample then cached pool.
- `src/mobile/screens/QuizStory/QuizStoryScreen.tsx` — remove local `TopBannerAd`, add interstitial cooldown.
- `src/mobile/AppMobile.tsx` — route-level `ErrorBoundary` for the full-screen routes; mount `BannerHost`.
- `src/mobile/layout/MobileShell.tsx` — drop the pathname key on the motion wrapper.
- `src/main.tsx` (or a small `src/mobile/platform/crashLog.ts`) — global error listeners.

No changes to quiz scoring, gems, auth or ad revenue configuration.
