-- 1. Create Alliances/Kingdoms table
CREATE TABLE IF NOT EXISTS alliances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    crest_emoji text DEFAULT '🦁',
    owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    total_stars integer DEFAULT 0,
    biweekly_stars integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Members mapping (one alliance per user)
CREATE TABLE IF NOT EXISTS alliance_members (
    alliance_id uuid REFERENCES alliances(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    role text DEFAULT 'member' NOT NULL,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create simple alliance chat (bulletin board)
CREATE TABLE IF NOT EXISTS alliance_chat (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alliance_id uuid REFERENCES alliances(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    username text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_chat ENABLE ROW LEVEL SECURITY;

-- Allow select/insert/update policies
CREATE POLICY "Allow read access to all alliances for authenticated" 
    ON alliances FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow members read access"
    ON alliance_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow members chat read access"
    ON alliance_chat FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM alliance_members 
            WHERE alliance_members.alliance_id = alliance_chat.alliance_id 
              AND alliance_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow members write chat access"
    ON alliance_chat FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM alliance_members 
            WHERE alliance_members.alliance_id = alliance_chat.alliance_id 
              AND alliance_members.user_id = auth.uid()
        )
    );

-- Secure RPC: Create Alliance
CREATE OR REPLACE FUNCTION create_alliance(p_name text, p_description text, p_crest_emoji text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_alliance_id uuid;
    out_details jsonb;
BEGIN
    -- Check if user already belongs to an alliance
    IF EXISTS (SELECT 1 FROM alliance_members WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object('error', 'You already belong to a Kingdom.');
    END IF;

    -- Validate name length
    IF char_length(p_name) < 3 OR char_length(p_name) > 20 THEN
        RETURN jsonb_build_object('error', 'Kingdom name must be between 3 and 20 characters.');
    END IF;

    -- Create Alliance
    INSERT INTO alliances (name, description, crest_emoji, owner_id)
    VALUES (p_name, p_description, p_crest_emoji, p_user_id)
    RETURNING id INTO new_alliance_id;

    -- Add owner as a member with 'king' role
    INSERT INTO alliance_members (alliance_id, user_id, role)
    VALUES (new_alliance_id, p_user_id, 'king');

    out_details := jsonb_build_object(
        'success', true,
        'alliance_id', new_alliance_id
    );

    RETURN out_details;
END;
$$;

-- Secure RPC: Join Alliance
CREATE OR REPLACE FUNCTION join_alliance(p_alliance_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    out_details jsonb;
BEGIN
    -- Check if user already belongs to an alliance
    IF EXISTS (SELECT 1 FROM alliance_members WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object('error', 'You must leave your current Kingdom first.');
    END IF;

    -- Add member
    INSERT INTO alliance_members (alliance_id, user_id, role)
    VALUES (p_alliance_id, p_user_id, 'member');

    out_details := jsonb_build_object(
        'success', true,
        'alliance_id', p_alliance_id
    );

    RETURN out_details;
END;
$$;

-- Secure RPC: Leave Alliance
CREATE OR REPLACE FUNCTION leave_alliance(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u_alliance_id uuid;
    u_role text;
    out_details jsonb;
BEGIN
    -- Find member data
    SELECT alliance_id, role INTO u_alliance_id, u_role
    FROM alliance_members
    WHERE user_id = p_user_id;

    IF u_alliance_id IS NULL THEN
        RETURN jsonb_build_object('error', 'You are not in a Kingdom.');
    END IF;

    -- Delete membership record
    DELETE FROM alliance_members WHERE user_id = p_user_id;

    -- If user was the King, dissolve/delete the alliance entirely
    IF u_role = 'king' THEN
        DELETE FROM alliances WHERE id = u_alliance_id;
        out_details := jsonb_build_object(
            'success', true,
            'dissolved', true
        );
    ELSE
        out_details := jsonb_build_object(
            'success', true,
            'dissolved', false
        );
    END IF;

    RETURN out_details;
END;
$$;

-- Secure RPC: Retrieve bi-weekly rankings
CREATE OR REPLACE FUNCTION get_alliance_rankings()
RETURNS TABLE (
    alliance_id uuid,
    name text,
    description text,
    crest_emoji text,
    biweekly_stars bigint,
    total_stars bigint,
    member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS alliance_id,
        a.name,
        a.description,
        a.crest_emoji,
        COALESCE(SUM(p.stars), 0) AS biweekly_stars, -- dynamically compute biweekly stars from members
        a.total_stars::bigint,
        COUNT(am.user_id) AS member_count
    FROM alliances a
    LEFT JOIN alliance_members am ON am.alliance_id = a.id
    LEFT JOIN profiles p ON p.id = am.user_id
    GROUP BY a.id, a.name, a.description, a.crest_emoji, a.total_stars
    ORDER BY biweekly_stars DESC, a.total_stars DESC;
END;
$$;
