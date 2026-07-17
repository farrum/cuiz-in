-- Drop the previous function if it exists to avoid ambiguous overloads
DROP FUNCTION IF EXISTS update_alliance(uuid, text, text, text, uuid);

-- Secure RPC: Update Alliance
CREATE OR REPLACE FUNCTION update_alliance(p_alliance_id text, p_name text, p_description text, p_crest_emoji text, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u_role text;
    out_details jsonb;
BEGIN
    -- Check if user is the King of this alliance
    SELECT role INTO u_role FROM alliance_members 
    WHERE user_id = p_user_id::uuid AND alliance_id = p_alliance_id::uuid;
    
    IF u_role IS NULL OR u_role != 'king' THEN
        RETURN jsonb_build_object('error', 'Only the King can update the Kingdom.');
    END IF;

    -- Validate name length
    IF char_length(p_name) < 3 OR char_length(p_name) > 20 THEN
        RETURN jsonb_build_object('error', 'Kingdom name must be between 3 and 20 characters.');
    END IF;

    -- Check if the name is already taken by another kingdom
    IF EXISTS (SELECT 1 FROM alliances WHERE name = p_name AND id != p_alliance_id::uuid) THEN
        RETURN jsonb_build_object('error', 'Kingdom name is already taken.');
    END IF;

    -- Update Alliance
    UPDATE alliances 
    SET name = p_name, description = p_description, crest_emoji = p_crest_emoji
    WHERE id = p_alliance_id::uuid;

    out_details := jsonb_build_object(
        'success', true,
        'alliance_id', p_alliance_id
    );

    RETURN out_details;
END;
$$;
