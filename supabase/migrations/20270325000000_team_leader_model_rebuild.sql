-- Migration: Team Leader Model Rebuild
-- Description: Adds functions for team leader hierarchies, promotions/demotions, and admin reporting.
-- Created: 2026-06-24

-- 1. Get my team hierarchy (for team leaders and junior team leaders)
CREATE OR REPLACE FUNCTION public.get_my_team_hierarchy()
RETURNS TABLE (
  member_id UUID,
  username TEXT,
  display_name TEXT,
  email TEXT,
  role TEXT,
  direct_leader_id UUID,
  direct_leader_username TEXT,
  join_date DATE,
  status TEXT,
  last_active_date DATE,
  questions_answered BIGINT,
  questions_correct BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  -- Get current authenticated user ID
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  WITH RECURSIVE team_tree AS (
    -- Anchor: direct referrals of the logged-in leader
    SELECT 
      r.referred_id::uuid AS member_id,
      r.referred_name::text AS username,
      r.referred_email::text AS email,
      r.referrer_id::uuid AS direct_leader_id,
      r.referrer_name::text AS direct_leader_username,
      r.date::date AS join_date,
      r.status::text AS status,
      r.last_active_date::date AS last_active_date,
      1 AS depth
    FROM public.user_referrals r
    WHERE r.referrer_id::uuid = v_caller_id
    
    UNION ALL
    
    -- Recursive step: referrals under junior team leaders who are referred by caller
    SELECT 
      r.referred_id::uuid AS member_id,
      r.referred_name::text AS username,
      r.referred_email::text AS email,
      r.referrer_id::uuid AS direct_leader_id,
      r.referrer_name::text AS direct_leader_username,
      r.date::date AS join_date,
      r.status::text AS status,
      r.last_active_date::date AS last_active_date,
      tt.depth + 1 AS depth
    FROM public.user_referrals r
    JOIN team_tree tt ON r.referrer_id::uuid = tt.member_id
    WHERE tt.depth < 2 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = tt.member_id::text AND ur.role = 'junior_team_leader'
      )
  )
  SELECT 
    tt.member_id,
    p.username::text,
    p.display_name::text,
    tt.email,
    COALESCE(ur.role, 'player')::text AS role,
    tt.direct_leader_id,
    tt.direct_leader_username,
    tt.join_date,
    tt.status,
    tt.last_active_date,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id::text = tt.member_id::text), 0)::bigint AS questions_answered,
    COALESCE((SELECT COUNT(*) FROM public.quiz_answers qa WHERE qa.user_id::text = tt.member_id::text AND qa.correct = true), 0)::bigint AS questions_correct
  FROM team_tree tt
  JOIN public.profiles p ON p.id = tt.member_id
  LEFT JOIN public.user_roles ur ON ur.user_id::text = tt.member_id::text;
END;
$$;

-- 2. Promote member to junior team leader
CREATE OR REPLACE FUNCTION public.promote_member_to_junior_leader(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  is_main_leader BOOLEAN;
  is_referred BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 1. Check if caller is a Main Team Leader
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id::text AND role = 'team_leader'
  ) INTO is_main_leader;
  
  IF NOT is_main_leader THEN
    RAISE EXCEPTION 'Only Main Team Leaders can promote members to Junior Team Leaders';
  END IF;
  
  -- 2. Check if the member is directly referred by caller
  SELECT EXISTS (
    SELECT 1 FROM public.user_referrals 
    WHERE referrer_id::text = v_caller_id::text AND referred_id::text = p_member_id::text
  ) INTO is_referred;
  
  IF NOT is_referred THEN
    RAISE EXCEPTION 'You can only promote users from your own referral team';
  END IF;
  
  -- 3. Perform promotion
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role = 'player';
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (p_member_id::text, 'junior_team_leader')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 3. Demote junior leader back to player
CREATE OR REPLACE FUNCTION public.demote_junior_leader(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  is_main_leader BOOLEAN;
  is_referred BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 1. Check if caller is a Main Team Leader
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id::text AND role = 'team_leader'
  ) INTO is_main_leader;
  
  IF NOT is_main_leader THEN
    RAISE EXCEPTION 'Only Main Team Leaders can demote Junior Team Leaders';
  END IF;
  
  -- 2. Check if the member was referred by caller
  SELECT EXISTS (
    SELECT 1 FROM public.user_referrals 
    WHERE referrer_id::text = v_caller_id::text AND referred_id::text = p_member_id::text
  ) INTO is_referred;
  
  IF NOT is_referred THEN
    RAISE EXCEPTION 'You can only demote users from your own referral team';
  END IF;
  
  -- 3. Perform demotion
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role = 'junior_team_leader';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_member_id::text, 'player')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 4. Admin - Get all team leaders' performance
CREATE OR REPLACE FUNCTION public.admin_get_all_team_leaders_performance()
RETURNS TABLE (
  leader_id UUID,
  leader_username TEXT,
  leader_display_name TEXT,
  role TEXT,
  parent_leader_username TEXT,
  direct_team_size INT,
  total_team_size INT,
  questions_answered BIGINT,
  questions_correct BIGINT,
  last_active_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    ) INTO is_admin;
  END IF;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  RETURN QUERY
  WITH leader_list AS (
    SELECT DISTINCT
      ur.user_id::uuid AS id,
      p.username::text AS username,
      p.display_name::text AS display_name,
      ur.role::text AS leader_role
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id::text = ur.user_id::text
    WHERE ur.role IN ('team_leader', 'teamleader', 'junior_team_leader')
  ),
  member_hierarchies AS (
    SELECT 
      ll.id AS l_id,
      r.referred_id::uuid AS member_id,
      1 AS depth
    FROM leader_list ll
    JOIN public.user_referrals r ON r.referrer_id::text = ll.id::text
    
    UNION ALL
    
    SELECT 
      mh.l_id,
      r.referred_id::uuid AS member_id,
      2 AS depth
    FROM member_hierarchies mh
    JOIN public.user_referrals r ON r.referrer_id::text = mh.member_id::text
    WHERE mh.depth = 1 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id::text = mh.member_id::text AND ur.role = 'junior_team_leader'
      )
  )
  SELECT 
    ll.id AS leader_id,
    ll.username AS leader_username,
    ll.display_name AS leader_display_name,
    ll.leader_role AS role,
    (
      SELECT r.referrer_name::text 
      FROM public.user_referrals r 
      WHERE r.referred_id::text = ll.id::text 
      LIMIT 1
    ) AS parent_leader_username,
    COALESCE(
      (SELECT COUNT(DISTINCT r.referred_id)::int 
       FROM public.user_referrals r 
       WHERE r.referrer_id::text = ll.id::text), 0
    ) AS direct_team_size,
    COALESCE(
      (SELECT COUNT(DISTINCT member_id)::int 
       FROM member_hierarchies 
       WHERE l_id = ll.id), 0
    ) AS total_team_size,
    COALESCE(
      (
        SELECT COUNT(*)::bigint 
        FROM public.quiz_answers qa 
        WHERE qa.user_id::text IN (
          SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
        )
      ), 0
    ) AS questions_answered,
    COALESCE(
      (
        SELECT COUNT(*)::bigint 
        FROM public.quiz_answers qa 
        WHERE qa.user_id::text IN (
          SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
        ) AND qa.correct = true
      ), 0
    ) AS questions_correct,
    (
      SELECT MAX(r.last_active_date)::date 
      FROM public.user_referrals r 
      WHERE r.referred_id::text IN (
        SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
      )
    ) AS last_active_date
  FROM leader_list ll;
END;
$$;

-- 5. Admin - Get team ad performance analytics
CREATE OR REPLACE FUNCTION public.admin_get_team_ad_performance()
RETURNS TABLE (
  leader_id UUID,
  leader_username TEXT,
  leader_display_name TEXT,
  role TEXT,
  total_team_size INT,
  questions_answered BIGINT,
  ad_impressions BIGINT,
  ad_clicks BIGINT,
  ctr NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    ) INTO is_admin;
  END IF;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  RETURN QUERY
  WITH leader_list AS (
    SELECT DISTINCT
      ur.user_id::uuid AS id,
      p.username::text AS username,
      p.display_name::text AS display_name,
      ur.role::text AS leader_role
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id::text = ur.user_id::text
    WHERE ur.role IN ('team_leader', 'teamleader', 'junior_team_leader')
  ),
  member_hierarchies AS (
    SELECT 
      ll.id AS l_id,
      r.referred_id::uuid AS member_id,
      1 AS depth
    FROM leader_list ll
    JOIN public.user_referrals r ON r.referrer_id::text = ll.id::text
    
    UNION ALL
    
    SELECT 
      mh.l_id,
      r.referred_id::uuid AS member_id,
      2 AS depth
    FROM member_hierarchies mh
    JOIN public.user_referrals r ON r.referrer_id::text = mh.member_id::text
    WHERE mh.depth = 1 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id::text = mh.member_id::text AND ur.role = 'junior_team_leader'
      )
  )
  SELECT 
    ll.id AS leader_id,
    ll.username AS leader_username,
    ll.display_name AS leader_display_name,
    ll.leader_role AS role,
    COALESCE((SELECT COUNT(DISTINCT member_id)::int FROM member_hierarchies WHERE l_id = ll.id), 0) AS total_team_size,
    COALESCE(
      (
        SELECT COUNT(*)::bigint 
        FROM public.quiz_answers qa 
        WHERE qa.user_id::text IN (
          SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
        )
      ), 0
    ) AS questions_answered,
    -- Ad impressions by team members
    COALESCE(
      (
        SELECT COUNT(*)::bigint 
        FROM public.ad_views av 
        WHERE av.user_id::text IN (
          SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
        )
      ), 0
    ) AS ad_impressions,
    -- Ad clicks by team members
    COALESCE(
      (
        SELECT COUNT(*)::bigint 
        FROM public.ad_clicks ac 
        WHERE ac.user_id::text IN (
          SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id
        )
      ), 0
    ) AS ad_clicks,
    -- CTR
    CASE 
      WHEN COALESCE((SELECT COUNT(*)::bigint FROM public.ad_views av WHERE av.user_id::text IN (SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id)), 0) = 0 THEN 0.0
      ELSE ROUND(
        (COALESCE((SELECT COUNT(*)::bigint FROM public.ad_clicks ac WHERE ac.user_id::text IN (SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id)), 0)::numeric / 
         COALESCE((SELECT COUNT(*)::bigint FROM public.ad_views av WHERE av.user_id::text IN (SELECT member_id::text FROM member_hierarchies WHERE l_id = ll.id)), 0)::numeric) * 100, 2
      )
    END AS ctr
  FROM leader_list ll;
END;
$$;

-- Grant execution privileges on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_team_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_member_to_junior_leader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_junior_leader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_team_leaders_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_team_ad_performance() TO authenticated;
