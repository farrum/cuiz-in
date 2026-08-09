# Fix login failures: profile/auth account drift

## What I found (verified against the live database)

Passwords are fine — the lookup that turns a username into an email is pointing at the wrong (or missing) account.

- **62 profiles exist, but only 33 auth accounts.** 29 profiles (legacy players) have **no Supabase Auth user at all**, so login can never succeed for them. `player1` is one of these — the auth logs show a 404 "User not found" for its profile id.
- **3 profiles store an email that does not match their auth account**, so `auth-login` resolves the username to an address that either belongs to nobody or to a different user:

```text
username    profile email          real auth email
player12    player12@gmail.com     player12@cuiz.local
player11    player11@cuiz.local    player1@gmail.com
player2     player2@cuiz.local     ram@sham.com
```

  That is exactly why `player12` + `Player@2026` fails: the password was set on `player12@cuiz.local`, but login submits `player12@gmail.com`.
- `quizadmin` works because its profile email and auth email agree — which matches your experience.

## Plan

1. **Make username login resolve against the real auth account, not the stale profile email.**
   In `auth-login`, after finding the profile by username, look up the auth user by profile id and use *that* email for the password grant. Backfill `profiles.email` with the auth email whenever they differ, so the data self-heals on each login.
2. **Return a clear message when a profile has no auth account** ("this account needs to be re-created / contact support") instead of a generic wrong-password error, so these 29 legacy profiles stop looking like password bugs.
3. **One-off data repair:** sync `profiles.email` from `auth.users.email` for the 3 mismatched rows via a migration, so nothing depends on a login attempt to heal.
4. **Legacy accounts (29 profiles with no auth user):** decide with you how to handle them — see the question below.
5. Verify by calling the deployed function for `player12` / `quizadmin` and checking the edge logs.

## Technical notes

- Change is in `supabase/functions/auth-login/index.ts` (email resolution order: `auth.users` first, `profiles.email` as fallback) plus one data-sync migration on `public.profiles`.
- No change to how passwords are stored — they stay in Supabase Auth.
- After the fix, `player12` should log in with `Player@2026`; `player1` needs an auth account created (step 4).

## Open question

For the 29 legacy profiles with no auth account, do you want me to (a) create auth accounts for all of them with a temporary password so they can use Forgot Password, or (b) leave them and only show a clear "account needs re-registration" message?
