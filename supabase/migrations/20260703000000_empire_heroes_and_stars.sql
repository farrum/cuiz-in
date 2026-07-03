-- Add stars column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stars integer DEFAULT 0;

-- Create user_characters table
CREATE TABLE IF NOT EXISTS public.user_characters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    character_id text NOT NULL, -- 'socrates', 'aryabhata', 'chanakya', 'ramanujan'
    shards_collected integer DEFAULT 0,
    level integer DEFAULT 0, -- 0 means locked, 1+ represents unlocked level
    unlocked_at timestamp with time zone,
    UNIQUE(user_id, character_id)
);

-- Enable RLS on user_characters
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own characters" 
    ON public.user_characters FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters" 
    ON public.user_characters FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
    ON public.user_characters FOR UPDATE 
    USING (auth.uid() = user_id);

-- Secure RPC Function to process opening a mystery box
CREATE OR REPLACE FUNCTION open_mystery_box(user_uuid uuid, box_tier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_stars integer;
    tier_cost integer;
    reward_type text;
    reward_qty integer;
    rolled_shards integer;
    rolled_char text;
    reward_gems integer := 0;
    reward_stars integer := 0;
    reward_tickets integer := 0;
    out_label text;
    out_details jsonb;
    random_val numeric;
    characters_list text[] := ARRAY['socrates', 'aryabhata', 'chanakya', 'ramanujan'];
BEGIN
    -- 1. Determine cost
    IF box_tier = 'bronze' THEN
        tier_cost := 50;
    ELSIF box_tier = 'gold' THEN
        tier_cost := 150;
    ELSIF box_tier = 'legendary' THEN
        tier_cost := 400;
    ELSE
        RETURN jsonb_build_object('error', 'Invalid box tier');
    END IF;

    -- 2. Fetch user's stars balance
    SELECT COALESCE(stars, 0) INTO user_stars FROM profiles WHERE id = user_uuid;
    IF user_stars < tier_cost THEN
        RETURN jsonb_build_object('error', 'Insufficient stars balance');
    END IF;

    -- 3. Deduct stars cost
    UPDATE profiles SET stars = stars - tier_cost WHERE id = user_uuid;

    -- 4. Roll rewards based on tier and probability
    random_val := random() * 100;
    
    IF box_tier = 'bronze' THEN
        -- Bronze Chest Roll:
        -- 60% probability: Gems & Stars refund
        -- 30% probability: Socrates or Aryabhata Shards
        -- 10% probability: Spin ticket
        IF random_val < 60 THEN
            reward_gems := floor(random() * 11) + 10; -- 10-20 Gems
            reward_stars := floor(random() * 16) + 5; -- 5-20 Stars
            reward_type := 'gems_and_stars';
            out_label := 'Gems & Stars Pack';
        ELSIF random_val < 90 THEN
            -- Socrates or Aryabhata shards
            rolled_char := characters_list[floor(random() * 2) + 1]; -- index 1 or 2
            rolled_shards := floor(random() * 2) + 1; -- 1-2 shards
            reward_type := 'shards';
            out_label := rolled_char || ' Shards';
        ELSE
            reward_tickets := 1;
            reward_type := 'spin_ticket';
            out_label := '1 Spin Ticket';
        END IF;
        
    ELSIF box_tier = 'gold' THEN
        -- Gold Vault Roll:
        -- 50% probability: Gems & Stars refund
        -- 40% probability: Socrates, Aryabhata or Chanakya Shards
        -- 10% probability: 2 Scratch Cards
        IF random_val < 50 THEN
            reward_gems := floor(random() * 31) + 25; -- 25-55 Gems
            reward_stars := floor(random() * 41) + 15; -- 15-55 Stars
            reward_type := 'gems_and_stars';
            out_label := 'Royal Gems & Stars Pack';
        ELSIF random_val < 90 THEN
            rolled_char := characters_list[floor(random() * 3) + 1]; -- index 1, 2, or 3
            rolled_shards := floor(random() * 4) + 2; -- 2-5 shards
            reward_type := 'shards';
            out_label := rolled_char || ' Shards';
        ELSE
            reward_tickets := 2; -- Scratch cards
            reward_type := 'scratch_card';
            out_label := '2 Scratch Cards';
        END IF;

    ELSE
        -- Legendary Emperor's Tomb Roll:
        -- 40% probability: Heavy Gems & Stars
        -- 50% probability: High shards for any character
        -- 10% probability: Golden ticket loadout
        IF random_val < 40 THEN
            reward_gems := floor(random() * 101) + 100; -- 100-200 Gems
            reward_stars := floor(random() * 101) + 50; -- 50-150 Stars
            reward_type := 'gems_and_stars';
            out_label := 'Emperor''s Treasury Pack';
        ELSIF random_val < 90 THEN
            rolled_char := characters_list[floor(random() * 4) + 1]; -- index 1, 2, 3, or 4
            rolled_shards := floor(random() * 6) + 5; -- 5-10 shards
            reward_type := 'shards';
            out_label := rolled_char || ' Shards';
        ELSE
            reward_tickets := 3;
            reward_type := 'spin_scratch_bundle';
            out_label := 'Spin & Scratch Bundle';
        END IF;
    END IF;

    -- 5. Credit user rewards
    IF reward_gems > 0 THEN
        UPDATE profiles SET gems_balance = COALESCE(gems_balance, 0) + reward_gems WHERE id = user_uuid;
    END IF;
    IF reward_stars > 0 THEN
        UPDATE profiles SET stars = COALESCE(stars, 0) + reward_stars WHERE id = user_uuid;
    END IF;
    IF reward_tickets > 0 THEN
        IF reward_type = 'spin_ticket' THEN
            UPDATE profiles SET spin_tickets = COALESCE(spin_tickets, 0) + reward_tickets WHERE id = user_uuid;
        ELSIF reward_type = 'scratch_card' THEN
            UPDATE profiles SET scratch_cards = COALESCE(scratch_cards, 0) + reward_tickets WHERE id = user_uuid;
        ELSIF reward_type = 'spin_scratch_bundle' THEN
            UPDATE profiles SET spin_tickets = COALESCE(spin_tickets, 0) + 2, scratch_cards = COALESCE(scratch_cards, 0) + 2 WHERE id = user_uuid;
        END IF;
    END IF;

    IF reward_type = 'shards' THEN
        -- Upsert character shards in database
        INSERT INTO user_characters (user_id, character_id, shards_collected, level)
        VALUES (user_uuid, rolled_char, rolled_shards, 0)
        ON CONFLICT (user_id, character_id) DO UPDATE
        SET shards_collected = user_characters.shards_collected + EXCLUDED.shards_collected;
    END IF;

    -- Log reward in daily_rewards_log
    INSERT INTO daily_rewards_log (user_id, reward_type, amount)
    VALUES (user_uuid, 'chest_' || box_tier, COALESCE(reward_gems, 0));

    -- Return JSON results
    out_details := jsonb_build_object(
        'reward_type', reward_type,
        'label', out_label,
        'gems', reward_gems,
        'stars', reward_stars,
        'tickets', reward_tickets,
        'character_id', rolled_char,
        'shards', rolled_shards
    );

    RETURN out_details;
END;
$$;

-- Secure RPC Function to upgrade a character
CREATE OR REPLACE FUNCTION upgrade_character(user_uuid uuid, char_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_stars integer;
    current_shards integer;
    current_lvl integer;
    shards_needed integer;
    stars_needed integer;
BEGIN
    -- Fetch character data
    SELECT COALESCE(shards_collected, 0), COALESCE(level, 0) 
    INTO current_shards, current_lvl 
    FROM user_characters 
    WHERE user_id = user_uuid AND character_id = char_id;

    IF NOT FOUND THEN
        current_shards := 0;
        current_lvl := 0;
    END IF;

    -- Define leveling requirements
    -- Level 0 -> 1 (Unlock): 10 shards, 0 Stars
    -- Level 1 -> 2: 20 shards, 100 Stars
    -- Level 2 -> 3: 50 shards, 250 Stars
    -- Level 3 -> 4: 100 shards, 500 Stars
    IF current_lvl = 0 THEN
        shards_needed := 10;
        stars_needed := 0;
    ELSIF current_lvl = 1 THEN
        shards_needed := 20;
        stars_needed := 100;
    ELSIF current_lvl = 2 THEN
        shards_needed := 50;
        stars_needed := 250;
    ELSIF current_lvl = 3 THEN
        shards_needed := 100;
        stars_needed := 500;
    ELSE
        RETURN jsonb_build_object('error', 'Character is already at max level');
    END IF;

    -- Check if requirements are met
    IF current_shards < shards_needed THEN
        RETURN jsonb_build_object('error', 'Insufficient shards. Need ' || shards_needed || ' shards.');
    END IF;

    -- Check user's stars
    SELECT COALESCE(stars, 0) INTO user_stars FROM profiles WHERE id = user_uuid;
    IF user_stars < stars_needed THEN
        RETURN jsonb_build_object('error', 'Insufficient stars balance. Need ' || stars_needed || ' stars.');
    END IF;

    -- Deduct requirements
    UPDATE profiles SET stars = stars - stars_needed WHERE id = user_uuid;
    
    INSERT INTO user_characters (user_id, character_id, shards_collected, level, unlocked_at)
    VALUES (user_uuid, char_id, current_shards - shards_needed, current_lvl + 1, CASE WHEN current_lvl = 0 THEN now() ELSE NULL END)
    ON CONFLICT (user_id, character_id) DO UPDATE
    SET shards_collected = user_characters.shards_collected - EXCLUDED.shards_collected,
        level = current_lvl + 1,
        unlocked_at = CASE WHEN current_lvl = 0 THEN now() ELSE user_characters.unlocked_at END;

    RETURN jsonb_build_object(
        'success', true,
        'character_id', char_id,
        'new_level', current_lvl + 1,
        'remaining_shards', current_shards - shards_needed
    );
END;
$$;
