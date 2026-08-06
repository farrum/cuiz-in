# Fix the blinking app + migrate mobile ads to Unity LevelPlay

## Part 1 — Stop the blinking (first, independent of Unity)

Two confirmed causes in the current ad code:

1. **Illegal conditional hook in `src/mobile/ads/TopBannerAd.tsx`** — the component returns `<AdMobBanner />` for native platforms *before* its `useEffect` hooks run. React then sees a different hook count between renders, which throws and re-renders. `TopBannerAd` lives in `MobileShell` above the tab bar, so every flash hits every screen.
2. **Aggressive remount timers** — `TopBannerAd` swaps creative every 5s, and `SimpleAdBanner` rebuilds its container id every 10s (a full DOM remount plus script re-execution). Combined with the page-transition animation in `MobileShell`, this reads as continuous blinking.

Fixes:
- Move the native check below all hooks in `TopBannerAd` — one return path, no early return before hooks.
- Reserve a fixed-height slot for the banner so it appearing/disappearing no longer reflows the page.
- Raise the web banner refresh from 10s to 30s and swap content in place instead of fading it, so a refresh is not visible as a flash.
- Ads "not showing": on the native build the AdMob banner also needs `npx cap sync` after install. On web, only `active` slots render (existing behaviour). After the Unity migration the native path no longer depends on AdMob at all.

## Part 2 — Unity LevelPlay migration

### What LevelPlay is
LevelPlay (ex-ironSource) is a **native SDK** — Android/iOS only. There is no web build, so:
- **Native Android app:** banner, interstitial and rewarded all move to LevelPlay.
- **Website (cuiz.in):** LevelPlay cannot run there. The existing web ad stack (managed ad slots, Adsterra, VAST) stays as-is unless you want it changed separately.

### There is no official Capacitor plugin
LevelPlay ships as a Gradle dependency for native Android. To call it from the React app we add a **small in-repo Capacitor plugin** (a Java class under `android/app/src/main/java/com/geologon/cuiz/` plus a TypeScript wrapper), exposing `initialize`, `showBanner`, `hideBanner`, `loadInterstitial`, `showInterstitial`, `loadRewarded`, `showRewarded`, and events for loaded / failed / rewarded.

### Implementation steps
1. **Gradle** — add the ironSource/LevelPlay Maven repo and SDK dependency in `android/app/build.gradle`, keep the Java 21 compile options, add ProGuard keep rules.
2. **Manifest** — remove the AdMob `APPLICATION_ID` meta-data (keep it only if you want AdMob mediated *inside* LevelPlay), add the required permissions.
3. **Native plugin** — initialise with App Key `cae8dcab-c6a2-4fa1-a3f0-4ebb5ab2b644` at app start, wire the three formats to placements `Banner_Android`, `Interstitial_Android`, `Rewarded_Android`, and bridge callbacks to JS.
4. **TS layer** — `src/mobile/ads/levelplay.ts` (typed wrapper, no-ops off-native) and `LevelPlayBanner.tsx` replacing `AdMobBanner` inside `TopBannerAd`.
5. **Interstitials** — `InterstitialAd.tsx` and `QuizStoryScreen.tsx` call the native interstitial on native builds, preloading one ad ahead so there is no gap; the Adsterra/VAST path stays for web only.
6. **Rewarded** — wire `Rewarded_Android` into the mini-game "watch to earn gems" flows (`useMiniGameVideoAd`, Spin Wheel, Scratch). Gems are granted only on the SDK reward callback; the server-side gem write is unchanged.
7. **Consent and testing** — add GDPR / CCPA / COPPA consent calls, run the LevelPlay test suite on a registered test device, confirm each placement fills, then turn test mode off.
8. **Cleanup** — remove `@capacitor-community/admob` and `AdMobBanner.tsx` once LevelPlay is verified live (kept until then so you are never adless).
9. **Release** — `npx cap sync` after pulling; the existing auto version bump in `android/app/build.gradle` handles the version number.

### Rollout order
Blink fix → plugin scaffolding → banner live → interstitial → rewarded → AdMob removal.

## What I need from you

**Required**
- Confirm this is the **LevelPlay (ironSource) SDK**, not the legacy Unity Ads SDK. The docs link you sent is LevelPlay, so that is what I will build against.
- The **Ad Unit IDs** from the LevelPlay dashboard for each of the three placements — placement names alone are not enough for every format.
- Confirm **Android only**, or iOS too now (the Game ID differs per platform and iOS needs the tracking-permission prompt).

**Helpful**
- Which **mediation networks** you enabled in LevelPlay (AdMob, Meta, etc.). Each may need its own adapter dependency and an `app-ads.txt` line — our current `public/ads.txt` only has the AdMob publisher line.
- Whether the **website ads stay as they are**, or you also want them replaced.
- A **test device advertising ID** so I can enable LevelPlay test mode and confirm fill before release.
- Whether rewarded ads should be **opt-in only** ("watch for gems" button) — recommended for policy safety.

## Technical notes
Nothing here touches the database, the gem ledger, or auth. The native ad code is Android-only and guarded by `Capacitor.isNativePlatform()`, so the web build is unaffected apart from the banner refresh timing change.