# Why no ads are showing in the mobile app

Your ad dashboard shows requests arriving, so the app is asking for ads correctly. What is failing is the *fill* — the ad networks are choosing not to return an ad. Two concrete causes are visible in the project.

## Cause 1 (most likely): the seller-authorization file doesn't list your ad networks

Google Play checks a file on your website (`app-ads.txt`) to confirm which companies are allowed to sell ads in your app. Right now that file at cuiz.in contains a single line for Google AdSense:

```text
google.com, pub-2831295465597549, DIRECT, f08c47fec0942fa0
```

Your app's ads come from Unity LevelPlay and Unity Ads, and neither is listed. Most buyers refuse to bid on inventory they can't verify, which produces exactly what you see: plenty of requests, almost no ads shown.

## Cause 2: Unity Ads is started twice, two different ways

The app starts LevelPlay (which already contains the Unity Ads connector) and then *also* starts the Unity Ads kit directly with the same game ID. Unity's own guidance is to let the mediation layer do this. Two starts on one game ID can leave both paths refusing to serve, and this affects banners, full-screen ads and reward videos alike — matching "nothing shows anywhere".

A smaller related issue: the banner code changes a shared size object in place, which can make repeat banner requests use a stale size.

## What I'll do

1. Add the correct network lines to the authorization file (`public/app-ads.txt`), keeping the existing AdSense line. I need the exact lines from your LevelPlay dashboard (see below) so nothing is guessed.
2. Stop the app from starting Unity Ads directly. LevelPlay stays the single owner; the direct Unity path is only used if LevelPlay reports it isn't available, and never with a competing startup call.
3. Fix the banner size object so each request builds a fresh size.
4. Add a small, hidden diagnostics screen (reachable only from the admin area) showing live ad state: whether the ad kit started, whether a banner/full-screen/reward ad is loaded, and the last error text. This turns "no ads" into a readable reason on any device.

## What I need from you

In LevelPlay: **Setup → App-ads.txt** (or SDK Networks → app-ads.txt lines). It generates the exact lines for every network you've enabled. Paste them to me and I'll add them.

Also worth confirming while you're there: how many demand networks are actually enabled. If Unity Ads is the only one, fill in India will stay very low no matter what the app does; adding one or two more networks (for example Google AdMob, which you already have an account for) is the real fix for volume.

## Technical notes

- `public/app-ads.txt` — append LevelPlay/Unity/mediation lines; the file already serves correctly (HTTP 200, plain text) at cuiz.in.
- `android/app/src/main/java/com/geologon/cuiz/CustomAdMobPlugin.java` — remove the unconditional `UnityAds.initialize(...)` from `initialize()`; initialize the direct Unity path lazily only inside the fallback loaders. Replace mutation of the shared `ISBannerSize.BANNER` static with a per-request size instance.
- Add an `adDiagnostics()` plugin method returning init flags, load flags and last error strings; surface it in the existing admin debug panel.
- After these changes: `npm install`, `npm run build`, `npx cap sync android`, then rebuild the APK. Store and sideloaded builds both need the rebuild.
