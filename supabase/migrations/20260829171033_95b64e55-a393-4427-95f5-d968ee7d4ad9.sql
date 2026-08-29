CREATE OR REPLACE FUNCTION public.upgrade_character(user_uuid text, char_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text;
  v_level int;
  v_shards int;
  v_stars int;
  req_shards int;
  req_stars int;
BEGIN
  v_caller := COALESCE(auth.uid()::text, user_uuid);
  IF user_uuid IS NULL OR user_uuid <> v_caller THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  SELECT level, shards_collected INTO v_level, v_shards
  FROM public.user_characters
  WHERE user_id = user_uuid AND character_id = char_id
  FOR UPDATE;

  IF NOT FOUND THEN
    v_level := 0;
    v_shards := 0;
    INSERT INTO public.user_characters (user_id, character_id, shards_collected, level)
    VALUES (user_uuid, char_id, 0, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_level >= 4 THEN
    RETURN jsonb_build_object('error', 'Already at max level');
  END IF;

  req_shards := CASE v_level WHEN 0 THEN 10 WHEN 1 THEN 20 WHEN 2 THEN 50 ELSE 100 END;
  req_stars  := CASE v_level WHEN 0 THEN 0  WHEN 1 THEN 100 WHEN 2 THEN 250 ELSE 500 END;

  IF v_shards < req_shards THEN
    RETURN jsonb_build_object('error', format('Requires %s shards', req_shards));
  END IF;

  SELECT stars INTO v_stars FROM public.profiles WHERE id = user_uuid FOR UPDATE;
  IF COALESCE(v_stars, 0) < req_stars THEN
    RETURN jsonb_build_object('error', format('Requires %s Stars', req_stars));
  END IF;

  UPDATE public.user_characters
  SET shards_collected = shards_collected - req_shards,
      level = level + 1,
      unlocked_at = COALESCE(unlocked_at, now())
  WHERE user_id = user_uuid AND character_id = char_id;

  IF req_stars > 0 THEN
    UPDATE public.profiles SET stars = GREATEST(stars - req_stars, 0) WHERE id = user_uuid;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_level', v_level + 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upgrade_character(text, text) TO authenticated;