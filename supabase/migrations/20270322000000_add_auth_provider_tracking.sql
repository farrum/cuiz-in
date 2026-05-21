-- Migration to add auth provider tracking and fix missing Google/OAuth profiles

-- 1. Add provider column to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email';

-- 2. Populate provider column for existing users from auth.users
UPDATE public.profiles p
SET provider = COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
WHERE p.id = u.id::text;

-- 3. Update public.handle_new_user() trigger function to capture provider info
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  desired_username text;
  final_username text;
  suffix int := 0;
  user_provider text;
BEGIN
  -- Extract authentication provider
  user_provider := COALESCE(new.raw_app_meta_data->>'provider', 'email');

  desired_username := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );
  final_username := desired_username;

  -- Resolve username collisions by appending an incrementing suffix
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(final_username)) LOOP
    suffix := suffix + 1;
    final_username := desired_username || suffix::text;
    IF suffix > 1000 THEN
      final_username := desired_username || '_' || substr(new.id::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;

  -- Insert profile, updating provider and email on conflict if the ID matches
  INSERT INTO public.profiles (id, username, display_name, phone, email, auth_migrated, provider)
  VALUES (
    new.id::text,
    final_username,
    COALESCE(NULLIF(trim(new.raw_user_meta_data->>'display_name'), ''), final_username),
    new.raw_user_meta_data->>'phone',
    new.email,
    true,
    user_provider
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    provider = EXCLUDED.provider;

  -- Ensure role entry exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id::text, 'player')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$function$;

-- 4. Backfill any missing profiles for existing auth.users (e.g. from failed/skipped triggers)
INSERT INTO public.profiles (id, username, display_name, email, auth_migrated, provider)
SELECT 
  u.id::text,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data->>'username'), ''),
    split_part(u.email, '@', 1),
    'user_' || substr(u.id::text, 1, 8)
  ) as username,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data->>'display_name'), ''),
    split_part(u.email, '@', 1),
    'User ' || substr(u.id::text, 1, 8)
  ) as display_name,
  u.email,
  true,
  COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id::text = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Ensure user_roles exists for any newly backfilled profiles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'player'
FROM public.profiles
ON CONFLICT DO NOTHING;
