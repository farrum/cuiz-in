-- 1. Create gamification_settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.gamification_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_type text NOT NULL UNIQUE, -- e.g., 'wheel_prizes', 'daily_limits', 'jackpot_config'
    config jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (so the frontend can render the wheel)
CREATE POLICY "Anyone can read gamification settings" 
    ON public.gamification_settings FOR SELECT 
    USING (true);

-- Only admins can modify (Assuming admin check is based on a specific role or function, 
-- we use a generic placeholder here or require auth.role() = 'admin' if you have custom claims)
-- For this platform, let's assume auth is required and handled in the application layer or via a specific check.
CREATE POLICY "Admins can modify settings" 
    ON public.gamification_settings FOR ALL 
    USING (auth.role() = 'authenticated'); -- REPLACE with actual admin role check if applicable

-- 2. Insert Default Settings
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

-- 3. Create RPC Function to process a wheel spin securely
CREATE OR REPLACE FUNCTION process_wheel_spin(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    limits_config jsonb;
    jackpot_config jsonb;
    prizes_config jsonb;
    spins_today integer;
    jackpots_won_recently integer;
    prize record;
    random_val numeric;
    cumulative_prob numeric := 0;
    winning_prize jsonb;
    jackpot_id text;
    cooldown_days integer;
BEGIN
    -- 1. Check daily limits
    SELECT config INTO limits_config FROM gamification_settings WHERE setting_type = 'daily_limits';
    
    SELECT COUNT(*) INTO spins_today 
    FROM daily_rewards_log 
    WHERE user_id = user_uuid 
      AND reward_type = 'spin' 
      AND claimed_at > now() - interval '1 day';

    IF spins_today >= (limits_config->>'free_spins_per_day')::integer THEN
        RETURN '{"error": "Daily spin limit reached"}'::jsonb;
    END IF;

    -- 2. Load configurations
    SELECT config INTO prizes_config FROM gamification_settings WHERE setting_type = 'wheel_prizes';
    SELECT config INTO jackpot_config FROM gamification_settings WHERE setting_type = 'jackpot_config';
    jackpot_id := jackpot_config->>'jackpot_prize_id';
    cooldown_days := (jackpot_config->>'cooldown_days')::integer;

    -- 3. Roll the dice (0 to 100)
    random_val := random() * 100;
    
    -- Pick a prize based on probability
    FOR prize IN SELECT * FROM jsonb_array_elements(prizes_config) LOOP
        cumulative_prob := cumulative_prob + (prize.value->>'probability')::numeric;
        
        IF random_val <= cumulative_prob THEN
            winning_prize := prize.value;
            EXIT;
        END IF;
    END LOOP;

    -- Fallback if probabilities don't add up perfectly
    IF winning_prize IS NULL THEN
        winning_prize := prizes_config->0; 
    END IF;

    -- 4. Check Jackpot Cooldown
    IF winning_prize->>'id' = jackpot_id THEN
        SELECT COUNT(*) INTO jackpots_won_recently 
        FROM daily_rewards_log 
        WHERE user_id = user_uuid 
          AND reward_type = 'jackpot' 
          AND claimed_at > now() - (cooldown_days || ' days')::interval;

        IF jackpots_won_recently > 0 THEN
            -- User won jackpot too recently, fallback to the lowest prize (Try Again / 10 Gems)
            winning_prize := prizes_config->0; 
        END IF;
    END IF;

    -- 5. Award the Gems and Log it
    IF (winning_prize->>'value')::integer > 0 THEN
        UPDATE profiles SET gems_balance = COALESCE(gems_balance, 0) + (winning_prize->>'value')::integer WHERE id = user_uuid;
    END IF;

    INSERT INTO daily_rewards_log (user_id, reward_type, amount) 
    VALUES (
        user_uuid, 
        CASE WHEN winning_prize->>'id' = jackpot_id THEN 'jackpot' ELSE 'spin' END, 
        (winning_prize->>'value')::integer
    );

    -- 6. Return the winning prize to the frontend to animate the wheel
    RETURN winning_prize;
END;
$$;
