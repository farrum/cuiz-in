-- Secure RPC Function to process Hangman victory rewards
CREATE OR REPLACE FUNCTION claim_hangman_victory(user_uuid uuid, bid_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    net_gems_won integer;
    reward_stars integer := 30;
    out_details jsonb;
BEGIN
    -- 1. Validate bid amount
    IF bid_amount < 0 THEN
        RETURN jsonb_build_object('error', 'Invalid bid amount');
    END IF;

    -- 2. Award double the bid (original bid was deducted at start, so this is 2x bid back)
    -- This nets them +bid_amount gems.
    net_gems_won := bid_amount * 2;

    -- 3. Credit user's gems and stars in profiles
    UPDATE profiles 
    SET gems_balance = COALESCE(gems_balance, 0) + net_gems_won,
        stars = COALESCE(stars, 0) + reward_stars 
    WHERE id = user_uuid;

    -- 4. Log victory in daily_rewards_log
    INSERT INTO daily_rewards_log (user_id, reward_type, amount)
    VALUES (user_uuid, 'hangman_win', net_gems_won);

    out_details := jsonb_build_object(
        'success', true,
        'gems_awarded', net_gems_won,
        'stars_awarded', reward_stars
    );

    RETURN out_details;
END;
$$;
