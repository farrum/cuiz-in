CREATE OR REPLACE FUNCTION public.process_wheel_spin(user_uuid uuid, p_paid boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid text := user_uuid::text;
  prizes jsonb;
  total_weight numeric := 0;
  pick numeric;
  cumulative numeric := 0;
  chosen jsonb;
  p jsonb;
  weight numeric;
  prize_value int;
  entry_fee int := 5;
  bal int;
  already_played boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid()::text <> uid THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.wheel_spins WHERE user_id = uid AND spun_on = CURRENT_DATE) INTO already_played;

  IF already_played THEN
    IF NOT p_paid THEN
      RETURN jsonb_build_object('error', 'You have already spun the wheel today. Pay 5 Gems to spin again!', 'already_played', true);
    END IF;
    SELECT COALESCE(points, 0) INTO bal FROM public.profiles WHERE id = uid;
    IF bal IS NULL OR bal < entry_fee THEN
      RETURN jsonb_build_object('error', 'Not enough Gems to play again (5 Gems required).');
    END IF;
    UPDATE public.profiles
    SET points = COALESCE(points, 0) - entry_fee,
        gems_balance = COALESCE(points, 0) - entry_fee
    WHERE id = uid;
  END IF;

  SELECT config INTO prizes FROM public.gamification_settings WHERE setting_type = 'wheel_prizes';
  IF prizes IS NULL OR jsonb_array_length(prizes) = 0 THEN
    RETURN jsonb_build_object('error', 'No prizes configured');
  END IF;

  FOR p IN SELECT * FROM jsonb_array_elements(prizes) LOOP
    total_weight := total_weight + COALESCE((p->>'probability')::numeric, 1);
  END LOOP;

  pick := random() * total_weight;

  FOR p IN SELECT * FROM jsonb_array_elements(prizes) LOOP
    weight := COALESCE((p->>'probability')::numeric, 1);
    cumulative := cumulative + weight;
    IF pick <= cumulative THEN
      chosen := p;
      EXIT;
    END IF;
  END LOOP;

  IF chosen IS NULL THEN
    chosen := prizes->0;
  END IF;

  INSERT INTO public.wheel_spins (user_id, prize_id, prize_label, prize_value, spun_on)
  VALUES (uid, chosen->>'id', chosen->>'label', COALESCE((chosen->>'value')::int, 0), CURRENT_DATE);

  prize_value := COALESCE((chosen->>'value')::int, 0);
  IF prize_value > 0 THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + prize_value,
        gems_balance = COALESCE(points, 0) + prize_value
    WHERE id = uid;
  END IF;

  RETURN chosen;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_scratch_card(p_context text DEFAULT 'daily'::text, p_paid boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid text;
  prizes jsonb;
  p jsonb;
  total_weight numeric := 0;
  pick numeric;
  cumulative numeric := 0;
  chosen jsonb;
  weight numeric;
  prize_value int;
  entry_fee int := 5;
  bal int;
  already_played boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  uid := auth.uid()::text;

  IF p_context NOT IN ('daily','quiz') THEN
    RETURN jsonb_build_object('error', 'Invalid context');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.scratch_card_plays
    WHERE user_id = uid AND context = 'daily' AND played_on = CURRENT_DATE
  ) INTO already_played;

  IF p_context = 'daily' AND already_played THEN
    IF NOT p_paid THEN
      RETURN jsonb_build_object('error', 'Already played today. Pay 5 Gems to play again!', 'already_played', true);
    END IF;
    SELECT COALESCE(points, 0) INTO bal FROM public.profiles WHERE id = uid;
    IF bal IS NULL OR bal < entry_fee THEN
      RETURN jsonb_build_object('error', 'Not enough Gems to play again (5 Gems required).');
    END IF;
    UPDATE public.profiles
    SET points = COALESCE(points, 0) - entry_fee,
        gems_balance = COALESCE(points, 0) - entry_fee
    WHERE id = uid;
  END IF;

  SELECT config INTO prizes FROM public.gamification_settings WHERE setting_type = 'scratch_prizes';
  IF prizes IS NULL OR jsonb_array_length(prizes) = 0 THEN
    RETURN jsonb_build_object('error', 'No prizes configured');
  END IF;

  FOR p IN SELECT * FROM jsonb_array_elements(prizes) LOOP
    total_weight := total_weight + COALESCE((p->>'probability')::numeric, 1);
  END LOOP;

  pick := random() * total_weight;
  FOR p IN SELECT * FROM jsonb_array_elements(prizes) LOOP
    weight := COALESCE((p->>'probability')::numeric, 1);
    cumulative := cumulative + weight;
    IF pick <= cumulative THEN
      chosen := p;
      EXIT;
    END IF;
  END LOOP;

  IF chosen IS NULL THEN
    chosen := prizes->0;
  END IF;

  INSERT INTO public.scratch_card_plays (user_id, context, prize_id, prize_label, prize_value)
  VALUES (uid, p_context, chosen->>'id', chosen->>'label', COALESCE((chosen->>'value')::int, 0));

  prize_value := COALESCE((chosen->>'value')::int, 0);
  IF prize_value > 0 THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + prize_value,
        gems_balance = COALESCE(points, 0) + prize_value
    WHERE id = uid;
  END IF;

  RETURN jsonb_build_object(
    'id', chosen->>'id',
    'label', chosen->>'label',
    'value', prize_value
  );
END;
$function$;