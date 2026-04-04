

## Fix: Registration Failing with "Error sending confirmation email"

### Root Cause

Supabase Auth's `signUp()` is configured to require email confirmation, but the SMTP/email sending is failing. This is a Supabase-side email delivery issue -- either the built-in email service is rate-limited (Supabase's default mailer has a limit of ~4 emails/hour on free plans), or SMTP isn't configured properly.

### Two-Part Fix

**Part 1: Make registration work immediately (disable email confirmation requirement)**

Update the registration flow to NOT require email confirmation. Instead, auto-confirm users so they can start playing right away. This is done by:

1. Adding `emailRedirectTo` is already there, but the key fix is to **handle the Supabase email error gracefully** -- if signup succeeds but email fails, the user account IS created. The current code treats this as a fatal error when it shouldn't be.

2. Modify `UserRegistrationForm.tsx` to:
   - Check if `authData.user` exists even when `authError` contains an email-sending error
   - If the user was created but email failed, still proceed with registration (log them in)
   - Show a warning instead of blocking: "Account created but confirmation email couldn't be sent"

**Part 2: Enable auto-confirm in Supabase Dashboard (recommended)**

The permanent fix is to go to the Supabase Dashboard → Authentication → Settings and either:
- **Option A**: Enable "Auto Confirm" for email signups (users don't need to verify email)
- **Option B**: Configure custom SMTP (if email verification is important to you)

### Files to Change

1. **`src/components/UserRegistrationForm.tsx`**:
   - After `signUp()`, check if the error is specifically about email sending vs actual registration failure
   - If `authData.user` exists despite the error, treat registration as successful
   - Proceed with profile setup, referral tracking, and redirect
   - Show a non-blocking warning about email

### Code Change Summary

```typescript
// Current: treats ALL authErrors as fatal
if (authError) { /* show error, return */ }

// Fixed: distinguish email errors from real failures
if (authError) {
  // If user was created but email failed, continue
  if (authData?.user && authError.message?.includes('email')) {
    // Warn but don't block
    toast({ title: "Account Created", description: "..." });
  } else {
    // Real failure
    toast({ variant: "destructive", ... });
    return;
  }
}
```

### Supabase Dashboard Action Required

Go to **Supabase Dashboard → Auth → Settings → Email** and enable "Confirm email" to OFF (auto-confirm), OR configure SMTP with a real email provider for reliable delivery.

