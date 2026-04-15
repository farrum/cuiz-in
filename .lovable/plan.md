

## Fix: Admin Login and Edge Function Errors

### Root Cause

The admin login flow is broken because it never creates a real Supabase Auth session:

1. `AdminLogin.tsx` calls the `admin-auth` edge function, which validates username/password against environment secrets
2. `admin-auth` returns `adminUserId` and `adminUsername` but **no auth tokens**
3. The admin user IDs in the `profiles` table (e.g., `066otqbbqac7`) are not real `auth.users` entries — they have no email addresses
4. After navigating to `/admin`, `ProtectedRoute` runs `useAuthCheck`, which calls `supabase.auth.getSession()` — finds nothing — and clears all localStorage including `ADMIN_AUTH`
5. The admin gets redirected to `/login`, which tries to work but any edge function calls (like `admin-get-users`) fail with 401 because there's no JWT

### Fix Strategy

Since the admin profiles don't have real Supabase Auth accounts (no emails, non-UUID IDs), we cannot create real auth sessions for them. The fix is to make the admin flow work **without** requiring a Supabase session, by treating admin auth as a separate path.

### Changes

**1. `src/hooks/useAuthCheck.tsx`**
- When no Supabase session exists, check if `ADMIN_AUTH === 'true'` in localStorage before clearing everything
- If admin auth is present, set `isAuthenticated: true`, `isAdminAuth: true`, `userRole: 'admin'` using the cached localStorage values
- This stops the "logged out" loop

**2. `src/components/admin/AdminLogin.tsx`**
- After successful `admin-auth` call, also store a timestamp (`ADMIN_AUTH_TIME`) so we can expire stale admin sessions (e.g., after 24 hours)

**3. `src/components/AdminRouteGuard.tsx`**  
- No changes needed — it already accepts `isAdminAuth` as a valid access path

**4. Edge function calls from admin pages**
- The admin edge functions (`admin-get-users`, `admin-get-reports`, etc.) already use `SERVICE_ROLE_KEY` internally. They just need the request to reach them. Currently they may be checking for an Authorization header. We need to verify they accept requests without JWT or use a different auth mechanism.
- If they require JWT, update the admin page to pass the admin credentials in the request body instead of relying on the Authorization header.

### Files to modify
- `src/hooks/useAuthCheck.tsx` — Respect localStorage admin auth when no Supabase session exists
- `src/components/admin/AdminLogin.tsx` — Add session expiry timestamp
- Possibly admin edge functions if they reject requests without JWT

### What this fixes
- Admin can log in and stay logged in
- Admin page loads without "Edge Function returned a non-2xx status code" errors
- Regular user login flow remains unchanged

