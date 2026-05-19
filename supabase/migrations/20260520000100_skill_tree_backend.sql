-- 1. Insert Default Skill Nodes Config into gamification_settings
INSERT INTO public.gamification_settings (setting_type, config) VALUES
('skill_nodes', '[
  {
    "id": "extra_time",
    "name": "Time Lord",
    "description": "+5 seconds on all timer-based questions.",
    "cost": 100,
    "icon": "Clock",
    "level": 1,
    "prerequisites": []
  },
  {
    "id": "double_gems",
    "name": "Gem Magnet",
    "description": "10% chance to double Gems earned from a question.",
    "cost": 250,
    "icon": "Gem",
    "level": 2,
    "prerequisites": ["extra_time"]
  },
  {
    "id": "second_chance",
    "name": "Second Chance",
    "description": "Once per day, an incorrect answer does not reset your streak.",
    "cost": 500,
    "icon": "Shield",
    "level": 3,
    "prerequisites": ["double_gems"]
  }
]'::jsonb)
ON CONFLICT (setting_type) DO NOTHING;

-- 2. Create RPC Function to purchase a skill securely
CREATE OR REPLACE FUNCTION purchase_skill_node(user_uuid uuid, target_skill_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    skills_config jsonb;
    skill_node record;
    target_skill jsonb;
    current_gems integer;
    skill_cost integer;
    already_owned boolean;
BEGIN
    -- 1. Load skill configurations
    SELECT config INTO skills_config FROM gamification_settings WHERE setting_type = 'skill_nodes';
    
    -- Find the target skill
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

    -- 2. Check if user already owns it
    SELECT EXISTS (
        SELECT 1 FROM user_skills WHERE user_id = user_uuid AND skill_id = target_skill_id
    ) INTO already_owned;

    IF already_owned THEN
        RETURN '{"error": "You already own this skill!"}'::jsonb;
    END IF;

    -- 3. Check Gem Balance
    SELECT gems_balance INTO current_gems FROM profiles WHERE id = user_uuid;
    
    IF current_gems IS NULL OR current_gems < skill_cost THEN
        RETURN '{"error": "Not enough Gems to purchase this skill."}'::jsonb;
    END IF;

    -- 4. Execute Purchase
    -- Deduct Gems
    UPDATE profiles SET gems_balance = gems_balance - skill_cost WHERE id = user_uuid;
    
    -- Grant Skill
    INSERT INTO user_skills (user_id, skill_id) VALUES (user_uuid, target_skill_id);

    RETURN '{"success": true}'::jsonb;
END;
$$;
