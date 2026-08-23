# Fix the white boot screen and the app-wide flicker

## What the recording shows

Frame-by-frame extraction of the video confirms two separate problems:

1. **Boot**: the app shows a white screen for a while before the Hub paints.
2. **Flicker**: on both the Hub and the Quiz screen, the full-screen background alternates between the warm cream tone and a pale blue/white tone roughly 5-10 times per second. Content is not remounting — only the background repaints. The flicker stops completely while a fullscreen AdMob/Google ad is on screen (the WebView stops compositing behind it) and resumes the moment the ad is dismissed. That behaviour is the signature of a continuous full-screen repaint loop, not an ad bug.

## Confirmed causes

**A. Missing import crashes the boot path (verified)**
`src/mobile/AppMobile.tsx` calls `Capacitor.isNativePlatform()` at line 97 but never imports `Capacitor`. The call sits in the `finally` block of the boot routine, so every cold start throws a `ReferenceError` there and `SplashScreen.hide()` is never reached. The native splash disappears on its own 1.2s timer and the user stares at a blank WebView until React finishes painting.

**B. `living-sky` animates `background-position` full-screen, forever (verified)**
`src/mobile/layout/MobileShell.tsx` puts the `living-sky` class on the root `fixed inset-0` container that wraps every shell route. In `src/index.css`, `.living-sky` runs a 12s infinite `skyShift` keyframe over a 300%-wide multi-stop gradient with `will-change: background-position`. Background-position is not GPU-compositable in the Android WebView — every frame repaints the entire viewport, and the cream-to-blue stops in that gradient are exactly the two tones alternating in the video.

**C. Quiz screen repaints at 16fps while a question is on screen (verified)**
`QuizStoryScreen` runs a `setInterval` every 60ms during the `asking` phase that calls `setProgress`, re-rendering the screen ~16 times a second and re-animating a framer-motion width. Combined with the full-screen `fixed` stack and a `-z-10` gradient layer, each render forces a fresh full-screen composite. This is why the flicker is worst mid-question and calms down during reveal/ad phases.

**D. Compounding always-on animations**
Ember particles (`will-change: transform, opacity` on ~20 nodes), flame, shine, gem-shimmer and `animate-pulse`/`animate-bounce` elements all run permanently on the Hub, keeping the WebView above its layer budget on mid-range devices.

## Fix

1. **Import `Capacitor` in `AppMobile.tsx`** and hide the splash as soon as the first screen mounts, guarded by try/catch so a plugin failure can never blank the app.
2. **Replace the animated `living-sky` background** with a static gradient of the same palette. If the subtle motion is worth keeping, re-implement it as an absolutely positioned overlay that animates `opacity`/`transform` (compositable) instead of `background-position`, and disable it entirely on native.
3. **Stop the 60ms render loop in the quiz.** Drive the progress ring with a pure CSS/framer-motion 20s transition started once per question instead of a state tick, so answering a question triggers a handful of renders rather than hundreds.
4. **Make the quiz background a normal, non-negative-z sibling** inside the fixed container so the WebView does not have to re-resolve a negative stacking layer against the parent's own background on every paint.
5. **Trim permanent animations on native**: cap embers, and gate `animate-pulse` / `animate-bounce` / shimmer decorations behind a reduced-motion-style flag on Capacitor builds.
6. **Verify** by rebuilding, watching the Hub and running a 5+ question quiz session, checking that the background stays stable across ad breaks.

## Technical notes

Files touched: `src/mobile/AppMobile.tsx`, `src/mobile/layout/MobileShell.tsx`, `src/index.css` (`.living-sky`, ember/flame `will-change`), `src/mobile/screens/QuizStory/QuizStoryScreen.tsx`, `src/mobile/components/EmberBackground.tsx`. No backend, ad-network or gameplay-logic changes — ad placement, cadence and rewards stay exactly as they are.
