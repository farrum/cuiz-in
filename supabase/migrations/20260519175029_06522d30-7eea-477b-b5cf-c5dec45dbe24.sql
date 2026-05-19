CREATE TABLE IF NOT EXISTS public.gamification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type text NOT NULL UNIQUE,
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read gamification settings" ON public.gamification_settings;
CREATE POLICY "Anyone can read gamification settings"
  ON public.gamification_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage gamification settings" ON public.gamification_settings;
CREATE POLICY "Admins can manage gamification settings"
  ON public.gamification_settings FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.gamification_settings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gamification_settings_updated_at ON public.gamification_settings;
CREATE TRIGGER trg_gamification_settings_updated_at
BEFORE UPDATE ON public.gamification_settings
FOR EACH ROW EXECUTE FUNCTION public.gamification_settings_set_updated_at();

INSERT INTO public.gamification_settings (setting_type, config) VALUES
('daily_limits', '{"free_spins_per_day": 1, "free_scratch_cards_per_day": 1}'::jsonb),
('jackpot_config', '{"cooldown_days": 30, "jackpot_prize_id": "6"}'::jsonb),
('wheel_prizes', '[
  { "id": "1", "label": "10 Gems", "color": "#fef08a", "value": 10, "probability": 40 },
  { "id": "2", "label": "50 Gems", "color": "#fca5a5", "value": 50, "probability": 10 },
  { "id": "3", "label": "Try Again", "color": "#e5e7eb", "value": 0, "probability": 25 },
  { "id": "4", "label": "100 Gems", "color": "#86efac", "value": 100, "probability": 4 },
  { "id": "5", "label": "25 Gems", "color": "#93c5fd", "value": 25, "probability": 20 },
  { "id": "6", "label": "Jackpot!", "color": "#c084fc", "value": 500, "probability": 1 }
]'::jsonb)
ON CONFLICT (setting_type) DO NOTHING;