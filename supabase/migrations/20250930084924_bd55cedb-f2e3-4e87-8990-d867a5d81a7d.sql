-- Enable RLS on tables that have policies but RLS is disabled
-- This fixes the "Policy Exists RLS Disabled" security errors

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;