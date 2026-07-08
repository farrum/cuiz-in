-- Rebuild User Hierarchy Migration
-- Standardize roles to medieval ranks, set up task distribution, requests, and auto-promotion trigger.

-- 1. Standardize existing roles in public.user_roles
UPDATE public.user_roles SET role = 'infantry' WHERE role = 'player';
UPDATE public.user_roles SET role = 'officer' WHERE role = 'junior_team_leader';
UPDATE public.user_roles SET role = 'baron' WHERE role IN ('team_leader', 'teamleader');

-- 2. Add is_manual column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- 3. Create team_join_requests table
CREATE TABLE IF NOT EXISTS public.team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_leader_id, status)
);

-- Enable RLS on team_join_requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for team_join_requests
CREATE POLICY "Users can view their own requests"
ON public.team_join_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = target_leader_id);

CREATE POLICY "Users can create their own requests"
ON public.team_join_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Target leaders can update requests"
ON public.team_join_requests FOR UPDATE TO authenticated
USING (auth.uid() = target_leader_id);

-- 4. Create empire_tasks table (replaces LocalStorage)
CREATE TABLE IF NOT EXISTS public.empire_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_count INT NOT NULL DEFAULT 1,
    current_count INT NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('quests', 'games', 'riddles')),
    reward_gems INT NOT NULL DEFAULT 0,
    reward_stars INT NOT NULL DEFAULT 0,
    reward_shards INT NOT NULL DEFAULT 0,
    shard_type TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on empire_tasks
ALTER TABLE public.empire_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks assigned to or by them"
ON public.empire_tasks FOR SELECT TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "Users can create tasks"
ON public.empire_tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can update their tasks"
ON public.empire_tasks FOR UPDATE TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "Users can delete their assigned tasks"
ON public.empire_tasks FOR DELETE TO authenticated
USING (auth.uid() = assigned_by);

-- 5. Auto-promotion and trigger logic
CREATE OR REPLACE FUNCTION public.recalculate_single_user_role(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_is_manual BOOLEAN;
  v_direct_ref_count INT;
  v_knight_ok BOOLEAN := TRUE;
  v_baron_ok BOOLEAN := TRUE;
  v_rec RECORD;
  v_grandchild_count INT;
  v_new_role TEXT := 'infantry';
BEGIN
  -- If user is admin (King), keep admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id::text AND role = 'admin'
  ) THEN
    RETURN;
  END IF;

  -- Check if user's role is manual
  SELECT COALESCE(is_manual, FALSE) INTO v_is_manual
  FROM public.user_roles
  WHERE user_id = p_user_id::text
  LIMIT 1;
  
  IF v_is_manual = TRUE THEN
    RETURN;
  END IF;

  -- Count direct referrals
  SELECT COUNT(*) INTO v_direct_ref_count
  FROM public.user_referrals
  WHERE referrer_id::text = p_user_id::text;

  IF v_direct_ref_count < 5 THEN
    v_new_role := 'infantry';
  ELSE
    -- Check Knight condition: each of the direct referrals has >= 1 referral
    FOR v_rec IN 
      SELECT referred_id::uuid FROM public.user_referrals WHERE referrer_id::text = p_user_id::text
    LOOP
      SELECT COUNT(*) INTO v_grandchild_count
      FROM public.user_referrals
      WHERE referrer_id::text = v_rec.referred_id::text;

      IF v_grandchild_count < 1 THEN
        v_knight_ok := FALSE;
      END IF;
      
      -- For Baron, each direct referral must have >= 5 referrals, and each of their referrals must have >= 1 referral
      IF v_grandchild_count < 5 THEN
        v_baron_ok := FALSE;
      ELSE
        -- Check if all grandchildren under this child have >= 1 referral
        IF EXISTS (
          SELECT 1 
          FROM public.user_referrals r1
          LEFT JOIN (
            SELECT referrer_id::text, COUNT(*) as cnt 
            FROM public.user_referrals 
            GROUP BY referrer_id::text
          ) r2 ON r2.referrer_id = r1.referred_id::text
          WHERE r1.referrer_id::text = v_rec.referred_id::text
            AND (r2.cnt IS NULL OR r2.cnt < 1)
        ) THEN
          v_baron_ok := FALSE;
        END IF;
      END IF;
    END LOOP;

    IF v_baron_ok THEN
      v_new_role := 'baron';
    ELSIF v_knight_ok THEN
      v_new_role := 'knight';
    ELSE
      v_new_role := 'officer';
    END IF;
  END IF;

  -- Update role (delete old non-admin roles to keep one role clean)
  DELETE FROM public.user_roles WHERE user_id = p_user_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_user_id::text, v_new_role, FALSE)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- upward recalculation to trigger chain promotions
CREATE OR REPLACE FUNCTION public.apply_hierarchy_promotions_upward(p_start_user_id UUID)
RETURNS VOID AS $$
DECLARE
  curr_user_id UUID := p_start_user_id;
  parent_id UUID;
BEGIN
  WHILE curr_user_id IS NOT NULL LOOP
    PERFORM public.recalculate_single_user_role(curr_user_id);
    
    SELECT referrer_id::uuid INTO parent_id
    FROM public.user_referrals
    WHERE referred_id::text = curr_user_id::text
    LIMIT 1;
    
    IF parent_id IS NULL OR parent_id = curr_user_id THEN
      EXIT;
    END IF;
    
    curr_user_id := parent_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function on referrals table
CREATE OR REPLACE FUNCTION public.trg_user_referrals_promo()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger upward promotion calculation starting from the referrer
  IF NEW.referrer_id IS NOT NULL THEN
    PERFORM public.apply_hierarchy_promotions_upward(NEW.referrer_id::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_user_referrals_promo ON public.user_referrals;
CREATE TRIGGER trg_user_referrals_promo
AFTER INSERT OR UPDATE ON public.user_referrals
FOR EACH ROW EXECUTE FUNCTION public.trg_user_referrals_promo();

-- 6. RPC function for side-switching approvals
CREATE OR REPLACE FUNCTION public.approve_team_join_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_leader_id UUID;
  v_leader_username TEXT;
  v_leader_email TEXT;
  v_user_username TEXT;
  v_user_email TEXT;
BEGIN
  -- Get request info
  SELECT user_id, target_leader_id INTO v_user_id, v_leader_id
  FROM public.team_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Verify caller is the target leader
  IF auth.uid() <> v_leader_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get leader profiles details
  SELECT username, email INTO v_leader_username, v_leader_email
  FROM public.profiles
  WHERE id = v_leader_id;

  -- Get user profile details
  SELECT username, email INTO v_user_username, v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  -- Update join request status
  UPDATE public.team_join_requests
  SET status = 'approved'
  WHERE id = p_request_id;

  -- Upsert user referral record
  INSERT INTO public.user_referrals (referred_id, referred_name, referred_email, referrer_id, referrer_name, referrer_email, date, status, last_active_date)
  VALUES (
    v_user_id::text,
    v_user_username,
    v_user_email,
    v_leader_id::text,
    v_leader_username,
    v_leader_email,
    now()::date,
    'active',
    now()::date
  )
  ON CONFLICT (referred_id) 
  DO UPDATE SET
    referrer_id = EXCLUDED.referrer_id,
    referrer_name = EXCLUDED.referrer_name,
    referrer_email = EXCLUDED.referrer_email,
    date = EXCLUDED.date;

  -- Trigger promotion chain upward
  PERFORM public.apply_hierarchy_promotions_upward(v_leader_id);

  RETURN TRUE;
END;
$$;

-- Grant execution privileges
GRANT EXECUTE ON FUNCTION public.approve_team_join_request(UUID) TO authenticated;

-- 7. Overwrite get_my_team_hierarchy to recursively search the entire downline hierarchy
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
    
    -- Recursive step: referrals under junior team members (all members in tree recursively)
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
  )
  SELECT 
    tt.member_id,
    p.username::text,
    p.display_name::text,
    tt.email,
    COALESCE(ur.role, 'infantry')::text AS role,
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

-- 8. Get user's parent hierarchy path (for the top of homepage breadcrumb)
CREATE OR REPLACE FUNCTION public.get_user_hierarchy_path(p_user_id UUID)
RETURNS TABLE (
  level_index INT,
  user_id UUID,
  username TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE path_tree AS (
    -- Anchor: the user themself
    SELECT 
      0 AS level_idx,
      p_user_id AS u_id,
      p.username::text AS uname,
      COALESCE(ur.role, 'infantry')::text AS urole
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id::text = p.id::text
    WHERE p.id = p_user_id
    
    UNION ALL
    
    -- Recursive: get referrer
    SELECT 
      pt.level_idx + 1 AS level_idx,
      r.referrer_id::uuid AS u_id,
      r.referrer_name::text AS uname,
      COALESCE(ur.role, 'infantry')::text AS urole
    FROM public.user_referrals r
    JOIN path_tree pt ON r.referred_id::text = pt.u_id::text
    LEFT JOIN public.user_roles ur ON ur.user_id::text = r.referrer_id::text
    WHERE pt.u_id <> r.referrer_id::uuid -- prevent cycle
  )
  SELECT level_idx, u_id, uname, urole FROM path_tree ORDER BY level_idx DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_hierarchy_path(UUID) TO authenticated;

-- 9. RPC function for manual out-of-turn promotions
CREATE OR REPLACE FUNCTION public.promote_member_manually(p_member_id UUID, p_new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_member_referrer_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get caller's role
  SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = v_caller_id::text LIMIT 1;

  -- Ensure caller is a superior or admin
  IF v_caller_role <> 'admin' AND v_caller_role <> 'king' AND v_caller_role <> 'baron' AND v_caller_role <> 'knight' AND v_caller_role <> 'officer' THEN
    RAISE EXCEPTION 'Only superiors can promote members';
  END IF;

  -- Verify member is referred by caller
  SELECT referrer_id::uuid INTO v_member_referrer_id
  FROM public.user_referrals
  WHERE referred_id::uuid = p_member_id;

  IF v_caller_role <> 'admin' AND v_caller_role <> 'king' AND v_member_referrer_id <> v_caller_id THEN
    RAISE EXCEPTION 'You can only promote users within your team';
  END IF;

  -- Perform manual promotion
  DELETE FROM public.user_roles WHERE user_id = p_member_id::text AND role <> 'admin';
  INSERT INTO public.user_roles (user_id, role, is_manual)
  VALUES (p_member_id::text, p_new_role, TRUE);

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_member_manually(UUID, TEXT) TO authenticated;
