# Banner ads disappeared — diagnosis and fix

## What I verified

- All 13 ad slots in the database are `active` and still hold their creative code, and the app reports "13 slots loaded, no blocker" — so the app-side ad pipeline is working.
- Every web banner slot uses the same Adsterra key via `https://www.highperformanceformat.com/<key>/invoke.js`.
- Requesting that script with `cuiz.in` / `www.cuiz.in` as the referrer returns **HTTP 403 with an empty body**. Without a referrer it returns 200 but still zero bytes.

So the web banners are not broken in our code: the ad network is refusing to serve creatives for this domain (dead/blocked key, disabled site, or an unapproved domain in the Adsterra account). Our slots render an empty iframe, which is the blank gaps in the screenshots.

For the mobile app the situation is different: web ad HTML is deliberately disabled on native, and native banners come from AdMob (`CustomAdMob` plugin, banner unit `.../6948956225`). That code path is intact in the project, so the likely causes are AdMob-side (no fill, policy/account limitation, or an app build older than the AdMob wiring). This is unconfirmed and needs a device log check.

## Plan

1. **Web — stop showing empty ad frames**
   - Detect when an ad iframe delivers no creative (zero-height / empty document after a short timeout) and collapse the slot, so pages don't carry blank bands.
   - Add a small dev-only diagnostic (already partly present) reporting "slot loaded but network returned no creative", so this failure mode is visible next time instead of silent.

2. **Web — restore inventory** (needs your input, see question below)
   - Option A: fix the Adsterra side (re-add/verify `cuiz.in` in the Adsterra dashboard, generate a fresh direct-banner key) and I swap the new key into the slots.
   - Option B: switch web banner slots to another network you have approved.
   - Option C: fall back to in-house promo banners (Google Play install CTA, daily challenge, referral) whenever the network returns nothing — this also becomes the permanent fallback for option A/B.

3. **Mobile — confirm the real cause before changing code**
   - Verify the installed APK is a build that includes the AdMob banner host, then read `adb logcat` for `CustomAdMob` / Google Mobile Ads errors (`Init Error`, `showBanner error`, error code 3 = no fill).
   - If it's no-fill/misconfiguration: fix the unit id or ad request; if the plugin never initializes: fix initialization order in the native plugin.
   - Add the same house-banner fallback so the banner strip never sits empty.

## Technical notes

- Touched files (expected): `src/hooks/useScriptExecution.ts` (empty-creative detection), `src/components/ads/SimpleAdBanner.tsx` (collapse + fallback), a new house-banner component, and `src/mobile/ads/admob.ts` / `BannerHost.tsx` only if the logs show a code-side fault.
- No database migration is needed unless we change the slot code (a plain update of `ad_slots.code` with a new key).
