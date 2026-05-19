
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
BEGIN
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

  INSERT INTO public.profiles (id, username, display_name, phone, email, auth_migrated)
  VALUES (
    new.id::text,
    final_username,
    COALESCE(NULLIF(trim(new.raw_user_meta_data->>'display_name'), ''), final_username),
    new.raw_user_meta_data->>'phone',
    new.email,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id::text, 'player')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$function$;
