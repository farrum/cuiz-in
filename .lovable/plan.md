

## Rebuild: Registration, Login, and Profile Authentication

### Problem Diagnosis

After thorough investigation, the issues stem from a fragmented auth system with three competing mechanisms:

1. **Registration silently fails**: The `register-user` edge function shows only "shutdown" in logs -- no actual invocations recorded. The auth logs show `/signup` (native Supabase Auth endpoint) was called instead, meaning either the edge function isn't deployed or calls are failing silently before reaching it.

2. **Login fails for new users**: The `auth-login` edge function resolves username to email via profiles table, then calls Supabase Auth. If the profile wasn't created (due to #1), this lookup fails.

3. **RLS blocks everything**: `get_current_user_id()` strictly returns `auth.uid()` with no fallback. `set_user_context()` rejects calls where `auth.uid()` doesn't match. Legacy localStorage-based auth is essentially broken.

4. **Ghost users**: player41 can answer questions because quiz_questions has a public SELECT policy and quiz_answers INSERT only checks `user_id = auth.uid()::text` -- but without a proper Supabase Auth session, the profile is never created.

### Rebuild Architecture

Single auth path: **Supabase Auth only**. No legacy fallback. No localStorage-based authentication.

```text
REGISTER                         LOGIN
   |                                |
   v                                v
register-user Edge Function     auth-login Edge Function
   |                                |
   v                                v
admin.createUser()              resolve username -> email
   +                                |
ensureProfileAndRole()              v
   |                           signInWithPassword()
   v                                |
Return user_id + auto-login         v
   |                           Return access_token
   v                                |
Client: signInWithPassword()        v
   |                           Client: setSession()
   v                                |
Redirect to /quiz                   v
                               Redirect to /quiz
```

### Files to Change

**1. `supabase/functions/register-user/index.ts`** -- Add detailed error logging, return tokens for auto-login after registration:
- After creating user, call `signInWithPassword` to get tokens
- Return `access_token` and `refresh_token` alongside `user.id`
- Add `console.log` at every step for debugging

**2. `src/components/UserRegistrationForm.tsx`** -- Auto-login after registration:
- After successful edge function call, use returned tokens to set session via `supabase.auth.setSession()`
- Store user data in localStorage
- Redirect directly to `/quiz` (skip the login page)

**3. `supabase/functions/auth-login/index.ts`** -- Simplify and harden:
- Remove the legacy MD5 password hash path entirely (it can't work with current RLS anyway)
- Always resolve username to email, then authenticate via Supabase Auth token endpoint
- Add error logging at each step

**4. `src/components/UserLogin.tsx`** -- Simplify login flow:
- Always go through `auth-login` edge function for both username and email inputs
- Remove the separate `supabase.auth.signInWithPassword()` path for email logins (edge function handles it)
- After getting tokens, call `supabase.auth.setSession()` to establish session
- Remove CryptoJS dependency (no more MD5 hashing)

**5. `src/hooks/useAuthCheck.tsx`** -- Remove legacy auth fallback:
- Remove Phase 2 (legacy localStorage-only auth)
- Only authenticate if `supabase.auth.getSession()` returns a valid session
- Keep localStorage writes for caching display data (username, role) but never use them as auth source
- If no session and user has localStorage data, redirect to login

**6. `src/hooks/profile/useProfileInfo.ts`** -- Remove `setUserContext` call:
- Remove the `setUserContext(storedUserId)` call (it fails when `auth.uid()` doesn't match)
- Rely on Supabase Auth session for RLS -- if session exists, `auth.uid()` works automatically

**7. `src/utils/authContext.ts`** -- Deprecate:
- Remove or empty out `setUserContext` and `clearUserContext` functions
- These are no longer needed since all auth goes through Supabase Auth

### Migration Safety

- Existing users with Supabase Auth accounts will work immediately
- Legacy users (MD5 password, no email) will need to re-register -- but the `auth-login` function currently can't authenticate them via RLS anyway, so this is already broken
- No database schema changes needed -- the `handle_new_user` trigger and `ensureProfileAndRole` in the edge function will both ensure profile creation

### Summary

This rebuild eliminates the dual auth system that has been the root cause of cascading failures. Every user will authenticate through Supabase Auth, every RLS check will use `auth.uid()`, and registration will auto-login users so they never hit the "registered but can't login" gap.

