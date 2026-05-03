# Auth System Recovery Plan

## What I Found (Step by Step)

### 1. Wrong email domain attached to this project
- This project (CuizIN, custom domain `cuiz.in`) has `notify.peepdo.com` configured as its sender domain — DNS pending.
- `peepdo.com` belongs to a different project. That's why password-reset / verification emails fail: the auth-email-hook is enqueueing through a domain that isn't ours.
- We need to **disable Lovable Emails for this project** so Supabase falls back to its default sender (`@supabase.co`). Auth emails (reset, verification) will start working immediately. Later we can attach a real `notify.cuiz.in` domain.

### 2. The "quizadmin keeps getting logged out" bug — this is the core mess
The admin login flow is still **hybrid / non-Supabase**:
- `quizadmin` logs in through the `admin-auth` edge function which just compares `ADMIN_USERNAME`/`ADMIN_PASSWORD` env secrets and writes `quiz_app_admin_auth=true` to localStorage. **No Supabase session is created.**
- `useAuthCheck` then calls `supabase.auth.getSession()` → returns null → falls back to the localStorage admin flag.
- Problem A: localStorage admin auth expires after 24 h → looks like "logged out".
- Problem B: every page that talks to Supabase uses RLS based on `auth.uid()`. Admin has **no `auth.uid()`** → policies like `is_current_user_admin()` (which checks `user_roles` by `auth.uid()`) all fail → admin panel sees empty data and components that re-check auth bounce the user out.
- Problem C: any `onAuthStateChange` event (INITIAL_SESSION / token refresh on a different tab) re-runs `checkAuth`, finds no Supabase session, and briefly toggles state — visible as random logouts.
- This violates our own rule (`mem://`): **Supabase Auth ONLY. No legacy/hybrid auth.**

This affects ONLY the admin user (regular Supabase-auth users are not logged out by this mechanism). The recent registration / reset-password attempts didn't break normal users — but the admin path was always broken since the hybrid was introduced.

### 3. Legacy `player*` accounts can't log in
Three distinct states across the `player*` users:

| State | Examples | Why login fails |
|---|---|---|
| No `auth.users` row, no email on profile | `player1`, `player3`, `player21–30`, `player31–33`, `player49`, `player` (quizadmin) | `auth-login` edge function rejects: "Account needs to be re-registered with an email address" |
| Has `auth.users` row, but `profiles.email` is NULL | `player11`, `player12`, `player2`, `player41` | Username lookup returns no email → same rejection |
| Suspended | `player22–27`, `player29` | Blocked by suspension check |

We can't send password resets to any of them because they have no email, and the email infra is broken anyway (see #1).

### 4. Other small things observed
- `admin-auth` uses `.single()` (violates our `.maybeSingle()` rule) and picks **the first profile with `is_admin=true`** — which today is `player` (id `066otqbbqac7`). That's why the admin "user" maps to that row.
- `useAuthCheck` writes to localStorage on every check — fine, but it also clears it whenever the Supabase session is briefly missing (e.g. during refresh). Combined with the admin-via-localStorage flow, it can race.

---

## The Fix (in order)

### Phase 1 — Stop the bleeding (email + admin)

1. **Detach `notify.peepdo.com` from this project** by disabling Lovable Emails. Supabase will then send password-reset / verification emails using its default sender. The user is informed that auth-email branding will be plain until we set up `notify.cuiz.in`.

2. **Migrate the admin onto real Supabase Auth** so the hybrid disappears:
   - Create (or attach) a Supabase auth user for `quizadmin` using `ADMIN_USERNAME` as the username and `ADMIN_PASSWORD` as the password, with email `quizadmin@cuiz.in` (placeholder, email-confirmed = true).
   - Link it to the existing admin profile `066otqbbqac7` (or migrate the profile to the new uuid — safer to update `profiles.id` is risky; instead create a fresh admin profile on the new auth uuid and copy `is_admin`, then point `user_roles.admin` to the new id; mark old `player` profile non-admin).
   - Delete / repurpose the `admin-auth` edge function and the `STORAGE_KEYS.ADMIN_AUTH` localStorage path. Admin logs in through the **same** `/login` page using username `quizadmin` + admin password. `useAuthCheck` then has a real `auth.uid()` and RLS works correctly.
   - Update `AdminLoginPage` to just redirect to `/login`, or keep the form but route it through `auth-login`.
   - Remove the localStorage admin fallback from `useAuthCheck`, `ProtectedRoute`, `AdminRouteGuard`, `AdminLoginPage`.

3. **Don't reset quizadmin's password** per your instruction — we'll use the existing `ADMIN_PASSWORD` value when creating the Supabase auth user.

### Phase 2 — Reset legacy player accounts to `!12345@ABc`

Run a one-shot migration that, for every `profiles.username` matching `player%` (excluding the admin profile we just migrated):

```text
For each legacy player profile P:
  if no auth.users row exists for P.id:
      create auth.users with
          id = P.id (preserves all FKs)
          email = P.username || '@cuiz.local'
          password = '!12345@ABc'
          email_confirmed_at = now()
  else:
      admin.updateUserById(P.id, { password: '!12345@ABc',
                                   email: coalesce(au.email, P.username||'@cuiz.local'),
                                   email_confirm: true })
  update profiles set
      email = (the email we just set),
      auth_migrated = true,
      suspended = false   -- only for the suspended test players, optional
  where id = P.id
```

After this, every `player*` test account can log in with username + `!12345@ABc`.

We do this via a new edge function `admin-reset-legacy-players` (callable once by quizadmin) so the service-role key never touches the client.

### Phase 3 — Cleanup & guardrails

- Remove `admin-auth` edge function and all `STORAGE_KEYS.ADMIN_AUTH` references.
- Remove the `password_hash` column on `profiles` (no longer used).
- Add a check in `auth-login` to gracefully handle "username with no email" by returning a clearer error.
- Document in `mem://auth/system` that admin uses Supabase Auth like every other user.

---

## Technical Details

### Files to change
- `src/hooks/useAuthCheck.tsx` — drop the `STORAGE_KEYS.ADMIN_AUTH` branch entirely.
- `src/components/ProtectedRoute.tsx`, `src/components/AdminRouteGuard.tsx` — remove `isAdminAuth` prop, derive admin only from `userRole === 'admin'`.
- `src/pages/AdminLoginPage.tsx` + `src/components/admin/AdminLogin.tsx` — replace with a redirect to `/login` (or keep a form that calls `auth-login`).
- `supabase/functions/admin-auth/` — delete.
- `supabase/functions/admin-reset-legacy-players/` — new, gated by checking the caller's JWT belongs to a user with `user_roles.role='admin'`.
- Email: call the toggle-emails tool to disable Lovable Emails; surface the NS records in case the user wants to clean them up at the registrar.

### Migration SQL
- Insert a new admin auth user, link to a new `profiles` row (or rewire), update `user_roles`, set old `player` profile `is_admin=false`.
- No schema change needed for the player reset — that runs through the Auth Admin API in the edge function.

### Rollout order in one build
1. Toggle emails off.
2. SQL migration: provision new admin auth user + rewire roles.
3. Code cleanup (remove hybrid).
4. Deploy `admin-reset-legacy-players` and call it once.
5. Verify: log in as quizadmin via `/login`, log in as `player1` with `!12345@ABc`.

### Risks
- Changing the admin's `profiles.id` could break historical references (login_logs, points etc.) — that's why we **add a new admin profile row** and demote the old `player` profile rather than mutating ids.
- Resetting suspended players' passwords does not unsuspend them; you'll still need to lift `suspended=true` in the admin panel if you want them usable.

---

## What I will NOT do
- Will not reset `quizadmin` password (per your instruction).
- Will not set up `notify.cuiz.in` in this pass — only disable the wrong `peepdo` domain. We can attach the correct domain in a follow-up.
- Will not touch real (non-`player*`) end-user accounts like `camera1` / `farrum`.

Approve and I'll execute Phases 1–3 in one pass.
