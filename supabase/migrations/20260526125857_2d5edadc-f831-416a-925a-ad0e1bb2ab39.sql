
-- Prize config
INSERT INTO public.gamification_settings (setting_type, config)
VALUES (
  'scratch_prizes',
  '[
    {"id":"miss","label":"Better luck next time","value":0,"probability":30},
    {"id":"g1","label":"1 Gem","value":1,"probability":30},
    {"id":"g2","label":"2 Gems","value":2,"probability":20},
    {"id":"g5","label":"5 Gems","value":5,"probability":10},
    {"id":"g10","label":"10 Gems","value":10,"probability":4},
    {"id":"g15","label":"15 Gems","value":15,"probability":3},
    {"id":"g25","label":"25 Gems","value":25,"probability":2},
    {"id":"g50","label":"50 Gems","value":50,"probability":1}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Plays table
CREATE TABLE IF NOT EXISTS public.scratch_card_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  context text NOT NULL CHECK (context IN ('daily','quiz')),
  prize_id text NOT NULL,
  prize_label text NOT NULL,
  prize_value integer NOT NULL DEFAULT 0,
  played_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS scratch_card_plays_daily_unique
  ON public.scratch_card_plays (user_id, played_on)
  WHERE context = 'daily';

ALTER TABLE public.scratch_card_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scratch plays"
  ON public.scratch_card_plays FOR SELECT
  USING ((user_id = (auth.uid())::text) OR public.is_current_user_admin());

CREATE POLICY "Admins manage scratch plays"
  ON public.scratch_card_plays FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- RPC
CREATE OR REPLACE FUNCTION public.process_scratch_card(p_context text DEFAULT 'daily')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid text;
  prizes jsonb;
  p jsonb;
  total_weight numeric := 0;
  pick numeric;
  cumulative numeric := 0;
  chosen jsonb;
  weight numeric;
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

  IF COALESCE((chosen->>'value')::int, 0) > 0 THEN
    UPDATE public.profiles SET gems_balance = gems_balance + (chosen->>'value')::int WHERE id = uid;
  END IF;

  RETURN jsonb_build_object(
    'id', chosen->>'id',
    'label', chosen->>'label',
    'value', COALESCE((chosen->>'value')::int, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_scratch_card(text) TO authenticated;
