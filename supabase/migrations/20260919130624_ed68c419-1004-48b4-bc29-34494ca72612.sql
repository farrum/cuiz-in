ALTER TABLE public.user_characters
  ADD COLUMN IF NOT EXISTS shards_purchased integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shards_spent integer NOT NULL DEFAULT 0;

-- Track lifetime acquisitions on every award
CREATE OR REPLACE FUNCTION public.award_character_shards(p_character_id text, p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text;
  v_total int;
  v_purchased int;
BEGIN
  v_caller := auth.uid()::text;
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;
  IF p_character_id IS NULL OR p_character_id NOT IN ('socrates','aryabhata','chanakya','ramanujan') THEN
    RETURN jsonb_build_object('error', 'Invalid character');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100 THEN
    RETURN jsonb_build_object('error', 'Invalid amount');
  END IF;

  INSERT INTO public.user_characters (user_id, character_id, shards_collected, level, shards_purchased)
  VALUES (v_caller, p_character_id, p_amount, 0, p_amount)
  ON CONFLICT (user_id, character_id)
  DO UPDATE SET
    shards_collected = public.user_characters.shards_collected + EXCLUDED.shards_collected,
    shards_purchased = public.user_characters.shards_purchased + EXCLUDED.shards_collected
  RETURNING shards_collected, shards_purchased INTO v_total, v_purchased;

  RETURN jsonb_build_object('success', true, 'shards', v_total, 'purchased', v_purchased);
END;
$function$;

-- Spend shards to use an advisor lifeline during play
CREATE OR REPLACE FUNCTION public.consume_advisor_shards(p_character_id text, p_amount integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text;
  v_shards int;
BEGIN
  v_caller := auth.uid()::text;
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;
  IF p_character_id IS NULL OR p_character_id NOT IN ('socrates','aryabhata','chanakya','ramanujan') THEN
    RETURN jsonb_build_object('error', 'Invalid character');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100 THEN
    RETURN jsonb_build_object('error', 'Invalid amount');
  END IF;

  SELECT shards_collected INTO v_shards
  FROM public.user_characters
  WHERE user_id = v_caller AND character_id = p_character_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(v_shards, 0) < p_amount THEN
    RETURN jsonb_build_object('error', 'Not enough shards', 'shards', COALESCE(v_shards, 0));
  END IF;

  UPDATE public.user_characters
  SET shards_collected = shards_collected - p_amount,
      shards_spent = shards_spent + p_amount
  WHERE user_id = v_caller AND character_id = p_character_id
  RETURNING shards_collected INTO v_shards;

  RETURN jsonb_build_object('success', true, 'shards', v_shards);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.consume_advisor_shards(text, integer) TO authenticated;