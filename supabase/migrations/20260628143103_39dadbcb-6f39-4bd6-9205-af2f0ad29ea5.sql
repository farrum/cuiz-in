
-- 1. One-time merge: add the separate game-winnings ledger into the canonical points total
UPDATE public.profiles
SET points = COALESCE(points, 0) + COALESCE(gems_balance, 0)
WHERE COALESCE(gems_balance, 0) > 0
  AND COALESCE(gems_balance, 0) <> COALESCE(points, 0);

-- Mirror gems_balance to points so any remaining reads stay consistent
UPDATE public.profiles
SET gems_balance = COALESCE(points, 0);

-- 2. Spin wheel: credit canonical points (and keep gems_balance mirrored)
CREATE OR REPLACE FUNCTION public.process_wheel_spin(user_uuid uuid)
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
BEGIN
  IF auth.uid() IS NULL OR auth.uid()::text <> uid THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  IF EXISTS (SELECT 1 FROM public.wheel_spins WHERE user_id = uid AND spun_on = CURRENT_DATE) THEN
    RETURN jsonb_build_object('error', 'You have already spun the wheel today. Come back tomorrow!');
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

-- 3. Scratch card: credit canonical points (and keep gems_balance mirrored)
CREATE OR REPLACE FUNCTION public.process_scratch_card(p_context text DEFAULT 'daily'::text)
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
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  uid := auth.uid()::text;

  IF p_context NOT IN ('daily','quiz') THEN
    RETURN jsonb_build_object('error', 'Invalid context');
  END IF;

  IF p_context = 'daily' AND EXISTS (
    SELECT 1 FROM public.scratch_card_plays
    WHERE user_id = uid AND context = 'daily' AND played_on = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object('error', 'Already played today', 'already_played', true);
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

-- 4. Skill purchase: spend from canonical points (and keep gems_balance mirrored)
CREATE OR REPLACE FUNCTION public.purchase_skill_node(user_uuid uuid, target_skill_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    skills_config jsonb;
    skill_node record;
    target_skill jsonb;
    current_gems integer;
    skill_cost integer;
    already_owned boolean;
BEGIN
    SELECT config INTO skills_config FROM gamification_settings WHERE setting_type = 'skill_nodes';

    FOR skill_node IN SELECT * FROM jsonb_array_elements(skills_config) LOOP
        IF skill_node.value->>'id' = target_skill_id THEN
            target_skill := skill_node.value;
            EXIT;
        END IF;
    END LOOP;

    IF target_skill IS NULL THEN
        RETURN '{"error": "Skill not found in configuration."}'::jsonb;
    END IF;

    skill_cost := (target_skill->>'cost')::integer;

    SELECT EXISTS (
        SELECT 1 FROM user_skills WHERE user_id = user_uuid AND skill_id = target_skill_id
    ) INTO already_owned;

    IF already_owned THEN
        RETURN '{"error": "You already own this skill!"}'::jsonb;
    END IF;

    SELECT COALESCE(points, 0) INTO current_gems FROM profiles WHERE id = user_uuid::text;

    IF current_gems IS NULL OR current_gems < skill_cost THEN
        RETURN '{"error": "Not enough Gems to purchase this skill."}'::jsonb;
    END IF;

    UPDATE profiles
    SET points = COALESCE(points, 0) - skill_cost,
        gems_balance = COALESCE(points, 0) - skill_cost
    WHERE id = user_uuid::text;

    INSERT INTO user_skills (user_id, skill_id) VALUES (user_uuid, target_skill_id);

    RETURN '{"success": true}'::jsonb;
END;
$function$;
