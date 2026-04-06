
Do I know what the issue is? Yes.

This app should not be dumped yet. The current failure looks concentrated and fixable: the backend auth is working, but the frontend auth lifecycle is likely deadlocking.

What I found:
- `auth-login` is succeeding on the backend. Logs show a successful login for `player41`, and the `profiles` table contains that user.
- That means the “stuck on Logging in...” problem is most likely on the client after tokens are returned.
- The strongest culprit is `onAuthStateChange` usage:
  - `src/App.tsx` uses an `async` auth state callback and does awaited profile/role queries inside it.
  - `src/hooks/useAuthCheck.tsx` calls `checkAuth()` from `onAuthStateChange`, and `checkAuth()` immediately calls `supabase.auth.getSession()`.
- Supabase specifically warns this pattern can deadlock `setSession()`, `getSession()`, and related auth flows. That matches your symptom exactly: register/login never finish.
- There is also fragility from `.single()` profile reads in `src/App.tsx` and admin screens, which can throw and cascade when profile data is briefly unavailable.
- The app still has mixed auth assumptions in header/mobile/admin areas via localStorage, which increases instability.

Plan to fix:
1. Remove auth deadlock pattern
   - Refactor `src/App.tsx` so `onAuthStateChange` does not await any Supabase auth/DB calls inside the callback.
   - Move async work into a separate function and trigger it with `setTimeout(..., 0)` or an equivalent deferred call.
   - Do the same in `src/hooks/useAuthCheck.tsx`: the callback should only schedule re-checking, not directly invoke auth methods in the callback stack.

2. Centralize session hydration
   - Create one shared “hydrate current user from session” flow used by app init and auth changes.
   - This flow should:
     - read the session safely
     - fetch profile with `.maybeSingle()`
     - fetch role with `.maybeSingle()`
     - update localStorage cache only after successful reads
   - This removes duplicated logic between `App.tsx` and `useAuthCheck.tsx`.

3. Harden login and registration completion
   - Keep `UserLogin.tsx` and `UserRegistrationForm.tsx` using the edge functions.
   - After `setSession()`, rely on the fixed auth listener/hydration flow instead of doing too much inline work.
   - Improve error reporting so if token-setting fails, the user sees the exact failure instead of an endless loading state.

4. Replace brittle `.single()` calls in auth-critical paths
   - Update auth-critical reads in:
     - `src/App.tsx`
     - `src/pages/AdminLoginPage.tsx`
     - `src/pages/AdminPage.tsx`
     - `src/components/ProtectedRoute.tsx`
   - Use `.maybeSingle()` where “no row yet” is recoverable, to prevent 406-style failures from breaking the session flow.

5. Stabilize auth-dependent UI
   - Update `Header.tsx` and `MobileNav.tsx` so they do not treat localStorage alone as proof of login.
   - They should react to the stabilized auth cache/session state, preventing “ghost logged-in” UI.

6. Verify the full flow end-to-end
   - Test:
     - new registration with auto-login
     - logout
     - login with username
     - login with email
     - refresh after login
     - admin login still working
   - Also verify the created user appears consistently in profile/admin data after registration.

Technical details:
- Primary files to change:
  - `src/App.tsx`
  - `src/hooks/useAuthCheck.tsx`
  - `src/components/UserLogin.tsx`
  - `src/components/UserRegistrationForm.tsx`
  - `src/components/Header.tsx`
  - `src/components/MobileNav.tsx`
  - likely a few `.single()` callers in admin/auth guard files
- No database migration is required for this fix.
- I would treat this as a frontend auth-state stabilization pass, not another backend rebuild.

Expected outcome:
- Login and registration stop hanging.
- Auto-login after registration completes reliably.
- Session state stays consistent across quiz/profile/admin surfaces.
- “Ghost user” UI behavior is reduced because localStorage stops acting like the source of truth.
