# Stability & Flicker Fix Plan (Mobile App)

I traced the flickering, blank screens and Quick Quiz crashes to five compounding causes. Here is what is actually happening and what needs correcting.

## What is causing it

**1. Every navigation shows the full-screen splash (main "blank screen" cause)**
The whole route tree sits inside one `Suspense` whose fallback is `MobileSplash` — a fixed, full-viewport screen. So whenever a route chunk isn't cached yet (Quick Quiz, Daily, Kingdoms...), the entire app — header, tabs, banner — is replaced by the splash for a moment. On top of that, `MobileShell` uses an exit-then-enter page animation, so the old screen animates away first, leaving an empty pane before the new one arrives.

**2. Nothing catches crashes**
There is no error boundary anywhere in the app. A single render error inside Quick Quiz, an ad, or any card unmounts the whole React tree and leaves a permanently blank screen with no way back except killing the app. This is the direct explanation for "clicking Quick Quiz crashes the app".

**3. The ad system is stuck in a refetch loop**
The ad hook rebuilds its fetch function on every state change, and its effect depends on that function — so the effect re-arms itself continuously, re-firing the "forced refresh" every cycle. The console confirms this: the same ad is re-fetched, re-selected and re-impression-tracked every ~30 seconds, forever.

**4. The banner ad tears down and rebuilds its DOM every 30 seconds**
The ad container's React `key` includes a refresh counter, so React destroys and recreates the ad node (and re-injects its scripts/iframes) on a timer. That is a real, visible flash and layout jump. Two independent, unsynchronised 30s timers (one in the banner, one in the mobile wrapper) make it worse.

**5. Hardware back button does a full page reload**
The back handler calls a hard URL assign to `/hub`, which reloads the entire WebView: splash again, re-auth, ad SDKs re-initialised. That reads as the app "restarting".

Secondary: unguarded `JSON.parse` of local storage in the Hub task loader, and overlapping un-cleared timers in the quiz reveal/advance chain that can double-fire when a user taps fast or changes preferences mid-question.

## What I will change

1. **Add an error boundary** around the mobile app (and a per-screen one inside the shell) with a "Something went wrong — Retry / Back to Hub" fallback, plus error logging so real crash reasons become visible instead of a white screen.
2. **Scope the loading fallback**: keep the full splash only for the initial boot, and use a lightweight in-pane skeleton for route transitions so the shell, tabs and banner never disappear during navigation.
3. **Soften page transitions**: switch the shell away from exit-then-enter so screens cross-fade instead of leaving an empty gap.
4. **Fix the ad refetch loop**: stabilise the fetch callback (depend on primitive values, not the whole state object) and stop the effect from re-arming itself, so the forced refresh runs once per mount.
5. **Stop the banner remount flicker**: keep a stable container element and swap the creative's contents in place instead of changing the React key; keep a single refresh timer and only refresh when the tab is visible.
6. **Make back navigation an in-app route change** instead of a full WebView reload.
7. **Harden the Quick Quiz path**: guard local-storage parsing, clear pending reveal/advance timers before starting a new question, ignore state updates after unmount, and make question loading fail into a visible "Couldn't load question — Retry" state rather than a stuck screen.

## Technical notes

- `src/mobile/AppMobile.tsx` — split Suspense boundaries; wrap tree in `ErrorBoundary`.
- New `src/components/ErrorBoundary.tsx` (class component with `componentDidCatch`) + a compact route-level fallback.
- `src/mobile/layout/MobileShell.tsx` — remove `mode="wait"`, add inner Suspense with skeleton.
- `src/hooks/useAdvertisement.ts` — memoise `fetchAds` on primitives, remove `fetchAds`/`adState.instanceId` from the effect deps, run the init force-refresh once via a ref.
- `src/components/ads/SimpleAdBanner.tsx` — drop `refreshNonce` from `containerId`/`key`; refresh content in place; single visibility-gated interval.
- `src/mobile/ads/TopBannerAd.tsx` — don't run the rotation timer when the DB-ad branch renders.
- `src/mobile/platform/init.ts` — replace `window.location.assign('/hub')` with router-based navigation so no reload occurs.
- `src/mobile/screens/Hub/HubScreen.tsx` — try/catch the two `JSON.parse` calls.
- `src/mobile/screens/QuizStory/QuizStoryScreen.tsx` — clear `advanceTimer`/`progressTimer` in `loadNext` and on unmount; add mounted ref guard; error state on load failure.

No backend, ad-network, or game-logic changes — this is stability and rendering only.