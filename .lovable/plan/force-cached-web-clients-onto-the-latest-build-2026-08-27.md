# Force cached web clients onto the latest build

## Why

`public/sw.js` (v3) is still served, but nothing in the current source registers it — only older builds did. Those previously installed service workers are still alive in returning users' browsers and serve app scripts with a stale-while-revalidate strategy, so a subset of visitors keep running old JavaScript (the code that writes the legacy `daily_tribute_login` task key). Nothing in the deploy pipeline currently signals "new build, drop your cache".

## What to build

1. **Self-retiring service worker.** Rewrite `public/sw.js` as v4 whose only job is to purge every cache it owns, unregister itself, and reload all open tabs once. Keeps the malicious-domain request block (the one behaviour we still want) but stops caching app scripts entirely, so no client can be pinned to an old bundle again.
2. **Build stamp + update check.** Inject a build id (timestamp) at build time via Vite `define`, expose it at `/version.json` generated during the build, and have the app compare its baked-in id against `/version.json` (fetched with `cache: 'no-store'`) on load and on tab focus. On mismatch: clear caches, unregister service workers, and hard-reload once (guarded in `sessionStorage` so it can never loop).
3. **Cache headers.** Ensure `.htaccess` sends `Cache-Control: no-cache` for `index.html`, `sw.js`, and `version.json`, while hashed assets under `/assets/` keep long-lived immutable caching.

## Technical notes

- Files touched: `public/sw.js`, `vite.config.ts` (define + small plugin writing `version.json`), a new `src/utils/buildVersion.ts`, a call site in `src/main.tsx`, and `.htaccess`.
- The reload is one-shot per build id, so no reload loops and no impact on native Capacitor builds (skipped when `Capacitor.isNativePlatform()`).
- Android APK users are unaffected by this; they update via the Play Store. The server-side legacy-key compatibility layer already handles them.

## Verification

- Confirm `/version.json` is emitted with a fresh id after a build.
- Load the app with an old service worker registered and confirm it unregisters, caches empty, and one reload occurs.
- Confirm a second load does not reload again.
