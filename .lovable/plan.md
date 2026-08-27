# App-version tracking for invalid UUID errors

This is already built and live — no further code changes are needed unless you want the extras below.

## What already exists

- Every request from the app carries `x-app-version` and `x-app-platform` headers (web build stamp, or native Android version).
- The database trigger that rejects legacy task keys (`daily_tribute_login`) records the reporting version/platform into a diagnostics table instead of silently failing.
- Admin → Sync tab has a "Client Versions" card listing app version, platform, event, hit count, and last seen for the past 7 days. Rows showing an unknown version are outdated cached web bundles or old APKs.

## Optional follow-ups (pick any)

1. Make the diagnostics window configurable (7 / 30 / 90 days) in the admin card.
2. Add a "stale clients" alert badge when unknown-version hits exceed a threshold in 24h.
3. Force cached web clients onto the latest build: retire the old service worker, add a build-stamp check with hard reload, and set no-cache headers on entry files — this is what actually stops the errors at the source.
