CREATE TABLE IF NOT EXISTS public.empire_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_count INT NOT NULL DEFAULT 1,
  current_count INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'quests',
  reward_gems INT NOT NULL DEFAULT 0,
  reward_stars INT NOT NULL DEFAULT 0,
  reward_shards INT NOT NULL DEFAULT 0,
  shard_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empire_tasks TO authenticated;
GRANT ALL ON public.empire_tasks TO service_role;

ALTER TABLE public.empire_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks assigned to or by them" ON public.empire_tasks;
CREATE POLICY "Users can view tasks assigned to or by them"
ON public.empire_tasks FOR SELECT TO authenticated
USING (auth.uid()::text = assigned_to OR auth.uid()::text = assigned_by OR assigned_to IS NULL OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Users can create tasks" ON public.empire_tasks;
CREATE POLICY "Users can create tasks"
ON public.empire_tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = assigned_by);

DROP POLICY IF EXISTS "Users can update their tasks" ON public.empire_tasks;
CREATE POLICY "Users can update their tasks"
ON public.empire_tasks FOR UPDATE TO authenticated
USING (auth.uid()::text = assigned_to OR auth.uid()::text = assigned_by);

DROP POLICY IF EXISTS "Users can delete their assigned tasks" ON public.empire_tasks;
CREATE POLICY "Users can delete their assigned tasks"
ON public.empire_tasks FOR DELETE TO authenticated
USING (auth.uid()::text = assigned_by);

CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  target_leader_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT team_join_requests_target_leader_id_fkey FOREIGN KEY (target_leader_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT team_join_requests_unique UNIQUE (user_id, target_leader_id, status)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_join_requests TO authenticated;
GRANT ALL ON public.team_join_requests TO service_role;

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON public.team_join_requests;
CREATE POLICY "Users can view their own requests"
ON public.team_join_requests FOR SELECT TO authenticated
USING (auth.uid()::text = user_id OR auth.uid()::text = target_leader_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Users can create their own requests" ON public.team_join_requests;
CREATE POLICY "Users can create their own requests"
ON public.team_join_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Target leaders can update requests" ON public.team_join_requests;
CREATE POLICY "Target leaders can update requests"
ON public.team_join_requests FOR UPDATE TO authenticated
USING (auth.uid()::text = target_leader_id);

DROP POLICY IF EXISTS "Users can delete their own requests" ON public.team_join_requests;
CREATE POLICY "Users can delete their own requests"
ON public.team_join_requests FOR DELETE TO authenticated
USING (auth.uid()::text = user_id);

CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.empire_tasks(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_task_progress TO authenticated;
GRANT ALL ON public.user_task_progress TO service_role;

ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own task progress" ON public.user_task_progress;
CREATE POLICY "Users manage their own task progress"
ON public.user_task_progress FOR ALL TO authenticated
USING (auth.uid()::text = user_id OR public.is_current_user_admin())
WITH CHECK (auth.uid()::text = user_id OR public.is_current_user_admin());

CREATE INDEX IF NOT EXISTS idx_empire_tasks_assigned_to ON public.empire_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tjr_target_leader ON public.team_join_requests(target_leader_id);
CREATE INDEX IF NOT EXISTS idx_utp_user ON public.user_task_progress(user_id);