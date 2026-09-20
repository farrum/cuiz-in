-- Shard transaction ledger for auditing when and how shards are earned and spent
CREATE TABLE IF NOT EXISTS public.shard_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  character_id text NOT NULL,
  amount integer NOT NULL, -- positive for credit, negative for debit
  action_type text NOT NULL, -- 'purchase', 'quest_bounty', 'lifeline_fifty_fifty', 'lifeline_audience_poll', 'lifeline_skip', 'lifeline_extra_time', 'sync_migration'
  balance_after integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.shard_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shard transactions" ON public.shard_transactions;
CREATE POLICY "Users can view own shard transactions"
  ON public.shard_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shard transactions" ON public.shard_transactions;
CREATE POLICY "Users can insert own shard transactions"
  ON public.shard_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all shard transactions" ON public.shard_transactions;
CREATE POLICY "Admins can view all shard transactions"
  ON public.shard_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()::text
      AND user_roles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_shard_tx_user_created ON public.shard_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shard_tx_char ON public.shard_transactions(character_id, created_at DESC);

GRANT SELECT, INSERT ON public.shard_transactions TO authenticated;
GRANT ALL ON public.shard_transactions TO service_role;

-- Update award_character_shards to log to shard_transactions
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
  VALUES (v_caller::uuid, p_character_id, p_amount, 0, p_amount)
  ON CONFLICT (user_id, character_id)
  DO UPDATE SET
    shards_collected = public.user_characters.shards_collected + EXCLUDED.shards_collected,
    shards_purchased = public.user_characters.shards_purchased + EXCLUDED.shards_collected
  RETURNING shards_collected, shards_purchased INTO v_total, v_purchased;

  -- Record audit log entry
  BEGIN
    INSERT INTO public.shard_transactions (user_id, character_id, amount, action_type, balance_after)
    VALUES (v_caller::uuid, p_character_id, p_amount, 'purchase', v_total);
  EXCEPTION WHEN OTHERS THEN
    -- Continue even if audit insert has non-critical issue
  END;

  RETURN jsonb_build_object('success', true, 'shards', v_total, 'purchased', v_purchased);
END;
$function$;

-- Update consume_advisor_shards to log to shard_transactions
CREATE OR REPLACE FUNCTION public.consume_advisor_shards(p_character_id text, p_amount integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text;
  v_shards int;
  v_action text;
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
  WHERE user_id = v_caller::uuid AND character_id = p_character_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(v_shards, 0) < p_amount THEN
    RETURN jsonb_build_object('error', 'Not enough shards', 'shards', COALESCE(v_shards, 0));
  END IF;

  UPDATE public.user_characters
  SET shards_collected = shards_collected - p_amount,
      shards_spent = shards_spent + p_amount
  WHERE user_id = v_caller::uuid AND character_id = p_character_id
  RETURNING shards_collected INTO v_shards;

  v_action := CASE p_character_id
    WHEN 'socrates' THEN 'lifeline_fifty_fifty'
    WHEN 'chanakya' THEN 'lifeline_audience_poll'
    WHEN 'aryabhata' THEN 'lifeline_skip'
    WHEN 'ramanujan' THEN 'lifeline_extra_time'
    ELSE 'lifeline_use'
  END;

  -- Record audit log entry
  BEGIN
    INSERT INTO public.shard_transactions (user_id, character_id, amount, action_type, balance_after)
    VALUES (v_caller::uuid, p_character_id, -p_amount, v_action, v_shards);
  EXCEPTION WHEN OTHERS THEN
    -- Non-blocking audit log failure
  END;

  RETURN jsonb_build_object('success', true, 'shards', v_shards);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.award_character_shards(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_advisor_shards(text, integer) TO authenticated;
