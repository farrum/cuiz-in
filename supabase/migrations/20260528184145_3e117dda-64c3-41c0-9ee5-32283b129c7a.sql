CREATE TABLE public.motivational_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  emoji text,
  trigger_context text NOT NULL DEFAULT 'general',
  weight integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.motivational_messages TO anon;
GRANT SELECT ON public.motivational_messages TO authenticated;
GRANT ALL ON public.motivational_messages TO service_role;

ALTER TABLE public.motivational_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active motivational messages"
ON public.motivational_messages FOR SELECT
USING (is_active = true OR is_current_user_admin());

CREATE POLICY "Admins manage motivational messages"
ON public.motivational_messages FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE INDEX idx_motivational_messages_trigger ON public.motivational_messages(trigger_context) WHERE is_active = true;

INSERT INTO public.motivational_messages (text, emoji, trigger_context) VALUES
  ('You got this! Keep going!', '💪', 'wrong_answer'),
  ('Mistakes are proof you''re trying!', '🌱', 'wrong_answer'),
  ('Almost! Try the next one.', '✨', 'wrong_answer'),
  ('Welcome back, champion!', '👋', 'app_open'),
  ('Ready to earn some gems?', '💎', 'app_open'),
  ('On fire! Keep that streak alive!', '🔥', 'streak_milestone'),
  ('Unstoppable!', '⚡', 'streak_milestone'),
  ('Still there? One more question?', '🤔', 'inactivity'),
  ('Your gems are waiting!', '💎', 'inactivity'),
  ('Brilliant!', '🎉', 'correct_answer'),
  ('Genius move!', '🧠', 'correct_answer'),
  ('Crushing it!', '🚀', 'correct_answer');