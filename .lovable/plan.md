# Stop the native white screen, flicker, and missing banners

## Confirmed from the recording

- The Android splash is initially dark, then the app exposes a full white WebView for several seconds before the Hub is ready.
- During the failure, the main app layer disappears while independently composited fixed UI (notably the music button/status area) can remain. This is a WebView composition failure, not normal React loading.
- A large empty white area appears where the app/banner surface should be. The flicker pauses while a native full-screen video ad covers the WebView, then returns when the WebView resumes.
- No banner creative appears during the affected Hub and quiz sequences.

## Confirmed code causes

1. **Splash is released too early.** The native configuration uses a zero-duration, auto-hiding splash, so Android exposes the WebView before React has produced a stable first frame.
2. **Two incompatible native ad paths are mixed.** Full-screen ads use the installed AdMob integration, while `BannerHost` calls a separate LevelPlay bridge. No LevelPlay Android dependency/plugin is installed in this project.
3. **Banner failure is hidden.** When that LevelPlay bridge is absent, the code still marks the banner as shown and reserves 50px. This creates an empty banner region and prevents a real retry/fallback.
4. **The native WebView still has excessive independent composition layers.** Full-screen fixed containers combine with blur/backdrop-filter, `will-change`, Framer Motion transforms, and permanent decorative animations. The recording’s “main page disappears but fixed overlay survives” pattern matches this layer separation.

## Implementation

### 1. Make startup atomic

- Keep the native splash visible instead of auto-hiding it immediately.
- Give the Android window, WebView, document, and React root the same opaque dark boot color so no white surface can be exposed.
- Hide the splash only after the authenticated route has mounted and two animation frames have painted; retain a guarded timeout so a failed plugin call can never trap the user on the splash.
- Replace the current animated loading fallback on native with an opaque, static first-paint surface.

### 2. Use AdMob as the single native ad owner

- Route native banners, interstitials, and rewarded ads through the installed AdMob integration only.
- Remove LevelPlay from the active mobile banner/interstitial flow rather than pretending an absent native bridge succeeded.
- Make banner state event-driven: loading, loaded, failed, hidden. Only report success after the native loaded event; clear state and allow a bounded retry after failure.
- Pass the correct bottom margin to AdMob: above the tab bar on shell routes and above the safe area on full-screen quiz/game routes.
- Keep exactly one session-long banner instance. Route changes reposition or preserve it; they do not create overlapping banner requests.

### 3. Stabilize Android WebView composition

- Add a native-only rendering mode at boot.
- In that mode, disable backdrop filters and nonessential infinite animation/layer promotion on shell content, bottom navigation, music control, embers, shimmer, flame glow, and route-entry effects.
- Keep the app’s visual design, but use opaque/static surfaces on native instead of translucent full-screen layers.
- Ensure every full-screen mobile route has one opaque root background and no negative stacking context.
- Pause decorative motion before a full-screen ad and restore only safe motion after the app becomes active again.

### 4. Make ad transitions deterministic

- Hide/suspend the banner before presenting a full-screen ad and restore it only after the close/failure callback and the WebView has resumed.
- Prevent concurrent show/load calls with one in-flight state machine.
- Advance the quiz exactly once after the ad result; a failed or unavailable ad must continue immediately without displaying a blank overlay.
- Add concise native diagnostics for first paint, banner loaded/failed, interstitial opened/closed, app pause/resume, and banner restoration so future device reports identify the failing stage.

## Verification

- Run the TypeScript/build checks and sync the Capacitor Android project using npm-based commands.
- Verify a cold launch never exposes white between the Android splash and Hub.
- Verify the Hub for at least 60 seconds: no whole-page dropout, no white bottom rectangle, and a real banner creative or a clean no-fill state.
- Run at least 10 quiz questions across two full-screen ad breaks: one ad request per break, no flicker before/after it, banner restored once, and content never overlapped.
- Check Hub, Quiz, Daily Challenge, Quest, Profile, and a mini-game at phone dimensions, including app background/foreground recovery.

## Scope

Native mobile boot, Android rendering stability, and native ad lifecycle only. Quiz rules, rewards, web advertising, database behavior, and visual content remain unchanged.
