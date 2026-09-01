# Stabilize mobile banners and eliminate recurring flicker

## What the investigation confirmed

- The video contains repeated full-screen dropouts around 19.8s, 34.0s, 49.0–49.8s, and 78.6s. The quiz footer/music control sometimes survives while the main WebView content disappears, which points to native-ad/WebView composition churn rather than an ordinary React animation.
- Mobile currently has competing banner representations: `BannerHost` owns the native SDK surface, shell/game routes mount `TopBannerAd` as a spacer, quiz also mounts a web `SimpleAdBanner`, and the purpose-built `NativeBannerAd` fallback is unused.
- Native placement uses a fixed 70dp tab offset and fixed 56dp container, while the real bottom navigation includes device safe-area padding and the SDK requests an adaptive-height creative. These independent measurements explain device-specific overlap with tabs/options.
- Banner refresh is not configured for 20 seconds: native and fallback rotation are 30 seconds, client/native throttles are 15 seconds, and quiz only requests refresh every third answer.
- Banner refresh and full-screen interstitial transitions can coincide. The native plugin reloads/recreates views attached directly to Android's content root, while interstitial open/close also hides and restores the banner. This is the strongest verified regression path for the recorded flicker.

## Implementation

### 1. Establish one banner owner and one layout contract

- Keep `BannerHost` as the only component allowed to load, refresh, show, hide, or reposition the native banner.
- Replace route-specific `TopBannerAd` and hand-built quiz spacers with `NativeBannerAd` on native routes; retain `TopBannerAd` only for browser/mobile-web creatives.
- Remove the native quiz `SimpleAdBanner` so a DOM banner cannot compete with the native banner or cover answer options.
- Use the existing fill event in `NativeBannerAd` so failed inventory collapses cleanly or shows the house fallback instead of leaving an unexplained blank strip.

### 2. Fix placement across devices

- Measure the rendered bottom navigation height and safe-area inset in the WebView, then pass that effective offset to the native banner host rather than using the hardcoded 70dp guess.
- Have the native plugin report/use the actual loaded adaptive banner height; update the shared CSS banner-height variable from that value.
- Reserve exactly that height in shell, quiz, daily challenge, and mini-game layouts so banners sit above tabs and below playable content without duplicate padding.
- Reposition the existing native container in place on route changes; do not recreate or force-refresh it merely because the route changed.

### 3. Make refresh deterministic and non-destructive

- Set one explicit 20-second refresh scheduler in the session-long native owner.
- Remove the every-third-question refresh and align browser fallback rotation to the same 20-second contract.
- Consolidate the JS/native throttles so one layer owns cadence; prevent refresh while a banner load or full-screen ad is active.
- Refresh the existing banner view where supported. If recreation is unavoidable after an SDK failure, keep the previous creative visible until replacement succeeds rather than exposing/removing the native surface.

### 4. Stop ad transitions from blanking the WebView

- Introduce a single serialized native ad state machine for banner loading, refresh, suspend, interstitial display, resume, and app background/foreground events.
- During interstitial open/close, suspend banner refresh, avoid repeated visibility/layout mutations, and restore the banner only after the app/WebView has resumed and painted.
- Keep quiz advancement single-flight until the next question has loaded; remove the short re-entry window that can allow overlapping `loadNext()` calls on slower devices.
- Make native quiz/shell root surfaces opaque and disable remaining native-only backdrop/compositing effects that can leave independent layers visible when the main WebView surface is repainted.

### 5. Add diagnostics and verify the regression

- Add concise native logs/events for requested margin, actual banner height, load/refresh result, interstitial lifecycle, banner suspend/resume, and rejected duplicate requests.
- Validate browser/mobile-web banner behavior separately so native stabilization does not alter website ad slots or the malicious-domain protections.
- Run focused tests and an Android sync/build check using npm scripts.
- On device, verify: Hub navigation with banner above tabs; quiz answers never covered; at least three visible 20-second banner refreshes; 10+ quiz questions across multiple interstitial opportunities; background/foreground recovery; no full-screen dropout, banner jump, duplicate request, or blank no-fill strip.

## Scope

Native mobile banner placement/refresh, mobile ad lifecycle, and related WebView rendering stability only. Quiz scoring, rewards, database schema, and desktop web advertising remain unchanged.
