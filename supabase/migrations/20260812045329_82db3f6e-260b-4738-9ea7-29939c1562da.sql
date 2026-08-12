
-- 1. Central currency award RPC (server-side, capped)
CREATE OR REPLACE FUNCTION public.award_currency(
  p_points_delta integer DEFAULT 0,
  p_stars_delta integer DEFAULT 0,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid text;
  new_points integer;
  new_stars integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  uid := auth.uid()::text;

  p_points_delta := COALESCE(p_points_delta, 0);
  p_stars_delta := COALESCE(p_stars_delta, 0);

  IF abs(p_points_delta) > 2000 OR abs(p_stars_delta) > 500 THEN
    RETURN jsonb_build_object('error', 'Award out of allowed range');
  END IF;

  PERFORM set_config('app.allow_currency_write', 'on', true);

  UPDATE public.profiles
  SET points = GREATEST(0, COALESCE(points, 0) + p_points_delta),
      gems_balance = GREATEST(0, COALESCE(points, 0) + p_points_delta),
      stars = GREATEST(0, COALESCE(stars, 0) + p_stars_delta)
  WHERE id = uid
  RETURNING points, stars INTO new_points, new_stars;

  PERFORM set_config('app.allow_currency_write', 'off', true);

  IF new_points IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'points', new_points, 'stars', new_stars);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_currency(integer, integer, text) TO authenticated;

-- 2. Block direct client writes to currency columns
CREATE OR REPLACE FUNCTION public.prevent_profile_currency_selfwrite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / backend jobs
  END IF;

  IF coalesce(current_setting('app.allow_currency_write', true), 'off') = 'on' THEN
    RETURN NEW;
  END IF;

  IF public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  NEW.points := OLD.points;
  NEW.gems_balance := OLD.gems_balance;
  NEW.stars := OLD.stars;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_currency_selfwrite ON public.profiles;
CREATE TRIGGER trg_prevent_profile_currency_selfwrite
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_currency_selfwrite();

-- 3. Allow existing definer game functions to write currency
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

  PERFORM set_config('app.allow_currency_write', 'on', true);

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

  PERFORM set_config('app.allow_currency_write', 'off', true);

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

  PERFORM set_config('app.allow_currency_write', 'on', true);

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

  PERFORM set_config('app.allow_currency_write', 'off', true);

  RETURN jsonb_build_object(
    'id', chosen->>'id',
    'label', chosen->>'label',
    'value', prize_value
  );
END;
$function$;

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
    IF auth.uid() IS NULL OR auth.uid() <> user_uuid THEN
        RETURN '{"error": "Unauthorized"}'::jsonb;
    END IF;

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

    PERFORM set_config('app.allow_currency_write', 'on', true);

    UPDATE profiles
    SET points = COALESCE(points, 0) - skill_cost,
        gems_balance = COALESCE(points, 0) - skill_cost
    WHERE id = user_uuid::text;

    PERFORM set_config('app.allow_currency_write', 'off', true);

    INSERT INTO user_skills (user_id, skill_id) VALUES (user_uuid, target_skill_id);

    RETURN '{"success": true}'::jsonb;
END;
$function$;

-- 4. Server-side withdrawal request with balance validation
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_method text DEFAULT 'UPI'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid text;
  uname text;
  bal int;
  gems_needed int;
  txn text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  uid := auth.uid()::text;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Invalid amount');
  END IF;

  -- 2 gems = 1 unit of payout
  gems_needed := ceil(p_amount * 2)::int;

  SELECT username, COALESCE(points, 0) INTO uname, bal FROM public.profiles WHERE id = uid;
  IF uname IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF bal < gems_needed THEN
    RETURN jsonb_build_object('error', 'Insufficient balance for this withdrawal');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = uid AND type = 'withdrawal' AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('error', 'You already have a pending withdrawal request');
  END IF;

  PERFORM set_config('app.allow_currency_write', 'on', true);
  UPDATE public.profiles
  SET points = COALESCE(points, 0) - gems_needed,
      gems_balance = COALESCE(points, 0) - gems_needed
  WHERE id = uid;
  PERFORM set_config('app.allow_currency_write', 'off', true);

  txn := extract(epoch from now())::bigint::text;

  INSERT INTO public.payments (user_id, username, amount, type, status, method, transaction_id, date)
  VALUES (uid, uname, p_amount, 'withdrawal', 'pending', COALESCE(p_method, 'UPI'), txn, to_char(now(), 'YYYY-MM-DD'));

  RETURN jsonb_build_object('success', true, 'transaction_id', txn, 'remaining_points', bal - gems_needed);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;

-- Restrict direct client inserts on payments to bounded achievement claims only
DROP POLICY IF EXISTS "Users can insert payment requests" ON public.payments;
CREATE POLICY "Users can claim bounded achievement rewards"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_current_user_id()
  AND type = 'achievement'
  AND amount > 0
  AND amount <= 1000
);

-- 5. Alliance RPCs must act on the caller only
CREATE OR REPLACE FUNCTION public.create_alliance(p_name text, p_description text, p_crest_emoji text, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_alliance_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    p_user_id := auth.uid()::text;

    IF EXISTS (SELECT 1 FROM alliance_members WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object('error', 'You already belong to a Kingdom.');
    END IF;

    IF char_length(p_name) < 3 OR char_length(p_name) > 20 THEN
        RETURN jsonb_build_object('error', 'Kingdom name must be between 3 and 20 characters.');
    END IF;

    INSERT INTO alliances (name, description, crest_emoji, owner_id)
    VALUES (p_name, p_description, p_crest_emoji, p_user_id)
    RETURNING id INTO new_alliance_id;

    INSERT INTO alliance_members (alliance_id, user_id, role)
    VALUES (new_alliance_id, p_user_id, 'king');

    RETURN jsonb_build_object('success', true, 'alliance_id', new_alliance_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_alliance(p_alliance_id uuid, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    p_user_id := auth.uid()::text;

    IF EXISTS (SELECT 1 FROM alliance_members WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object('error', 'You must leave your current Kingdom first.');
    END IF;

    INSERT INTO alliance_members (alliance_id, user_id, role)
    VALUES (p_alliance_id, p_user_id, 'member');

    RETURN jsonb_build_object('success', true, 'alliance_id', p_alliance_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.leave_alliance(p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    u_alliance_id uuid;
    u_role text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    p_user_id := auth.uid()::text;

    SELECT alliance_id, role INTO u_alliance_id, u_role
    FROM alliance_members
    WHERE user_id = p_user_id;

    IF u_alliance_id IS NULL THEN
        RETURN jsonb_build_object('error', 'You are not in a Kingdom.');
    END IF;

    DELETE FROM alliance_members WHERE user_id = p_user_id;

    IF u_role = 'king' THEN
        DELETE FROM alliances WHERE id = u_alliance_id;
        RETURN jsonb_build_object('success', true, 'dissolved', true);
    END IF;

    RETURN jsonb_build_object('success', true, 'dissolved', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_alliance(p_alliance_id text, p_name text, p_description text, p_crest_emoji text, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    u_role text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    p_user_id := auth.uid()::text;

    SELECT role INTO u_role FROM alliance_members
    WHERE user_id = p_user_id AND alliance_id = p_alliance_id::uuid;

    IF u_role IS NULL OR u_role <> 'king' THEN
        RETURN jsonb_build_object('error', 'Only the King can update the Kingdom.');
    END IF;

    IF char_length(p_name) < 3 OR char_length(p_name) > 20 THEN
        RETURN jsonb_build_object('error', 'Kingdom name must be between 3 and 20 characters.');
    END IF;

    IF EXISTS (SELECT 1 FROM alliances WHERE name = p_name AND id <> p_alliance_id::uuid) THEN
        RETURN jsonb_build_object('error', 'Kingdom name is already taken.');
    END IF;

    UPDATE alliances
    SET name = p_name, description = p_description, crest_emoji = p_crest_emoji
    WHERE id = p_alliance_id::uuid;

    RETURN jsonb_build_object('success', true, 'alliance_id', p_alliance_id);
END;
$function$;
