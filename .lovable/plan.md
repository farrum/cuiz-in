# Stop the recurring `daily_tribute_login` UUID errors

## Confirmed cause

- `user_task_progress.task_id` is currently a UUID foreign key to `empire_tasks.id`.
- A client request is still sending the legacy text identifier `daily_tribute_login`, so PostgreSQL rejects the request while converting the value to UUID. The request fails before a row can be stored, which is why the table remains empty and there is nothing to delete.
- The obsolete identifier was removed from the source on August 26, 2026. It is absent from the current source, current Android assets, database functions/triggers, and all 149 JavaScript chunks currently published on `cuiz.in`.
- Therefore, the errors shown on August 27 are coming from an older installed mobile build or an already-open legacy browser session—not the current build.

## Resolution

1. Add a database compatibility layer for old clients:
   - Change `user_task_progress.task_id` from UUID to text so PostgreSQL can receive the legacy identifier instead of failing during request parsing.
   - Preserve normal task integrity with a validation trigger: accept `daily_tribute_login` as the one supported legacy key; for every other value, require a valid UUID that exists in `empire_tasks`.
   - Add a unique key on `(user_id, task_id)` so repeated legacy requests update one progress record rather than creating duplicates.
   - Keep the existing authenticated-user/admin RLS policy and grants unchanged.

2. Keep the modern application path unchanged:
   - Current Daily Tribute awards continue through `award_currency` and local claim-state handling.
   - Current Empire task writes continue using UUID task IDs; text storage does not change their runtime representation in TypeScript/JavaScript.

3. Validate the compatibility behavior:
   - Confirm a legacy-style `daily_tribute_login` progress write succeeds without a UUID error.
   - Confirm a valid Empire task UUID still succeeds.
   - Confirm an arbitrary non-UUID task key is rejected by the validation trigger.
   - Recheck recent PostgreSQL logs after exercising the paths.

## Expected result

Old installed clients stop generating `invalid input syntax for type uuid: "daily_tribute_login"` immediately, while current clients and Empire task referential integrity remain protected. The compatibility key can be retired later after old mobile versions are no longer active.
