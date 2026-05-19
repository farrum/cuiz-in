-- Add gamification fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS avatar_level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS skill_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gems integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS spin_tickets integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scratch_cards integer DEFAULT 0;

-- Create user_skills table to track unlocked skill tree nodes
CREATE TABLE IF NOT EXISTS public.user_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id text NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

-- Enable RLS for user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills" 
    ON public.user_skills FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills" 
    ON public.user_skills FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create daily_rewards_log table to track spins and scratches and prevent abuse
CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_type text NOT NULL, -- e.g., 'spin', 'scratch'
    amount integer NOT NULL DEFAULT 0,
    claimed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for daily_rewards_log
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reward logs" 
    ON public.daily_rewards_log FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reward logs" 
    ON public.daily_rewards_log FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create an edge-function compatible type or just simple insert since we might do this via client-side RPC later.
