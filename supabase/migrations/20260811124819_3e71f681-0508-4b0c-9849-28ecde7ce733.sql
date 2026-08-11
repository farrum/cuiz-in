ALTER TABLE public.wheel_spins DROP CONSTRAINT IF EXISTS wheel_spins_user_id_spun_on_key;
DROP INDEX IF EXISTS public.wheel_spins_user_id_spun_on_key;
ALTER TABLE public.scratch_card_plays DROP CONSTRAINT IF EXISTS scratch_card_plays_daily_unique;
DROP INDEX IF EXISTS public.scratch_card_plays_daily_unique;
CREATE INDEX IF NOT EXISTS wheel_spins_user_day_idx ON public.wheel_spins (user_id, spun_on);
CREATE INDEX IF NOT EXISTS scratch_card_plays_user_day_idx ON public.scratch_card_plays (user_id, context, played_on);