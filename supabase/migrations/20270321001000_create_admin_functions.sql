
-- Function to allow admins to insert profile icons (bypassing RLS)
CREATE OR REPLACE FUNCTION public.admin_insert_profile_icon(
  icon_name TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::uuid = auth.uid() AND is_admin = true
  ) INTO is_admin;
  
  -- Only proceed if the user is an admin
  IF is_admin THEN
    INSERT INTO profile_icons (name, icon_url, is_active)
    VALUES (icon_name, icon_url, is_active)
    RETURNING id INTO new_id;
    
    RETURN new_id;
  ELSE
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;
END;
$$;

-- Function to allow admins to delete profile icons (bypassing RLS)
CREATE OR REPLACE FUNCTION public.admin_delete_profile_icon(
  p_icon_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  icon_exists boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::uuid = auth.uid() AND is_admin = true
  ) INTO is_admin;
  
  -- Only proceed if the user is an admin
  IF is_admin THEN
    -- Check if the icon exists
    SELECT EXISTS (
      SELECT 1 FROM profile_icons WHERE id = p_icon_id
    ) INTO icon_exists;
    
    IF icon_exists THEN
      DELETE FROM profile_icons WHERE id = p_icon_id;
      RETURN true;
    ELSE
      RETURN false;
    END IF;
  ELSE
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;
END;
$$;
