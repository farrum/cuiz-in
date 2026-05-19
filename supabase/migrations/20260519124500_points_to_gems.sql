-- Rename points columns to gems across the database

-- 1. Profiles Table
ALTER TABLE public.profiles RENAME COLUMN points TO gems_balance;

-- If there are total_points or all_time_points, rename them too
-- ALTER TABLE public.profiles RENAME COLUMN total_points TO total_gems;

-- 2. Daily Points Table -> Daily Gems
ALTER TABLE public.daily_points RENAME TO daily_gems;
ALTER TABLE public.daily_gems RENAME COLUMN points TO gems;

-- 3. Monthly Points Table -> Monthly Gems
ALTER TABLE public.monthly_points RENAME TO monthly_gems;
ALTER TABLE public.monthly_gems RENAME COLUMN points TO gems;

-- 4. Quiz History
-- ALTER TABLE public.quiz_history RENAME COLUMN points_earned TO gems_earned;

-- Update RPC functions (this depends on what exists, usually handled via dropping and recreating)
-- DROP FUNCTION IF EXISTS increment_points;
-- CREATE OR REPLACE FUNCTION add_gems(user_id uuid, amount integer) RETURNS void AS $$ ... $$ LANGUAGE sql;
