
-- Ensure case-insensitive uniqueness for email when present
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique
  ON public.profiles ((lower(email)))
  WHERE email IS NOT NULL;
