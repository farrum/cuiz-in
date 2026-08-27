# Tag every request with an app version to identify legacy clients

## Goal

Make it possible to tell, from the database side, exactly which app build is still sending the legacy `daily_tribute_login` task key (and any other invalid-uuid write).

## What to build

1. **Client version stamp.** Send two global headers on every Supabase request:
   - `x-app-version` — the build id baked in at build time (same stamp used for the cache-invalidation work).
   - `x-app-platform` — `web` or `android` (native Capacitor), plus the native app version when available.
   Old cached bundles cannot send these headers, so a missing `x-app-version` is itself the signal: "pre-fix client".

2. **Server-side capture.** Add a small `public.client_diagnostics` table (id, occurred_at, event, task_key, app_version, app_platform, user_agent, user_id) with RLS that lets only admins read it and nothing read it anonymously, plus the required grants. Extend the existing legacy-key compatibility trigger on `user_task_progress` so that whenever it maps a non-UUID task key it inserts one row capturing `current_setting('request.headers', true)` values (`x-app-version`, `x-app-platform`, `user-agent`).

3. **Admin visibility.** Add a compact "Client Versions" card in the admin diagnostics area that reads an aggregated RPC (`admin_get_client_diagnostics`) grouping the last 7 days by app version/platform with counts and last-seen timestamps, so the split between updated and legacy clients is visible at a glance.

## Technical notes

- Headers are set via `global.headers` when constructing the Supabase client. `src/integrations/supabase/client.ts` is generated, so the header values come from a new `src/utils/appVersion.ts` and the client file gets a minimal, clearly marked addition.
- Native builds read the version through `@capacitor/app`'s `getInfo()` when available, falling back to the web build stamp.
- The diagnostics insert happens inside a `SECURITY DEFINER` trigger, so it never fails the user's write; it is wrapped so any logging error is swallowed.
- Retention: the RPC only reads recent rows; a simple delete-older-than-30-days statement runs inside the same trigger occasionally to keep the table small.

## Verification

- Query `client_diagnostics` after a legacy-shaped write and confirm version/platform/user-agent are populated.
- Confirm requests from the current build carry `x-app-version` and that rows from old clients show it as null.
