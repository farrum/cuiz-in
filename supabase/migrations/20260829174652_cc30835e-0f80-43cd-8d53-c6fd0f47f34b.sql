CREATE OR REPLACE FUNCTION public.award_character_shards(p_character_id text, p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text;
  v_total int;
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

  INSERT INTO public.user_characters (user_id, character_id, shards_collected, level)
  VALUES (v_caller, p_character_id, p_amount, 0)
  ON CONFLICT (user_id, character_id)
  DO UPDATE SET shards_collected = public.user_characters.shards_collected + EXCLUDED.shards_collected
  RETURNING shards_collected INTO v_total;

  RETURN jsonb_build_object('success', true, 'shards', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.award_character_shards(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_character_shards(text, integer) TO authenticated;