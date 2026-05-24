
-- 1. gems_balance on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gems_balance integer NOT NULL DEFAULT 0;

-- 2. wheel_spins log
CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  prize_id text NOT NULL,
  prize_label text NOT NULL,
  prize_value integer NOT NULL DEFAULT 0,
  spun_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, spun_on)
);

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own spins" ON public.wheel_spins
  FOR SELECT USING (user_id = (auth.uid())::text OR public.is_current_user_admin());

CREATE POLICY "Admins manage spins" ON public.wheel_spins
  FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

-- 3. RPC
CREATE OR REPLACE FUNCTION public.process_wheel_spin(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid text := user_uuid::text;
  prizes jsonb;
  prize jsonb;
  total_weight numeric := 0;
  pick numeric;
  cumulative numeric := 0;
  chosen jsonb;
  p jsonb;
  weight numeric;
BEGIN
  -- Authorize: must be the calling user
  IF auth.uid() IS NULL OR auth.uid()::text <> uid THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Daily limit
  IF EXISTS (SELECT 1 FROM public.wheel_spins WHERE user_id = uid AND spun_on = CURRENT_DATE) THEN
    RETURN jsonb_build_object('error', 'You have already spun the wheel today. Come back tomorrow!');
  END IF;

  -- Load prizes
  SELECT config INTO prizes FROM public.gamification_settings WHERE setting_type = 'wheel_prizes';
  IF prizes IS NULL OR jsonb_array_length(prizes) = 0 THEN
    RETURN jsonb_build_object('error', 'No prizes configured');
  END IF;

  -- Total weight (default to 1 if probability missing)
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

  -- Log the spin
  INSERT INTO public.wheel_spins (user_id, prize_id, prize_label, prize_value, spun_on)
  VALUES (uid, chosen->>'id', chosen->>'label', COALESCE((chosen->>'value')::int, 0), CURRENT_DATE);

  -- Credit gems
  IF COALESCE((chosen->>'value')::int, 0) > 0 THEN
    UPDATE public.profiles SET gems_balance = gems_balance + (chosen->>'value')::int WHERE id = uid;
  END IF;

  RETURN chosen;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_wheel_spin(uuid) TO authenticated;
