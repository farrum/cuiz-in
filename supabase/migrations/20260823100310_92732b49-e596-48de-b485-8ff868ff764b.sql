CREATE TABLE IF NOT EXISTS public.user_characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id text NOT NULL,
  shards_collected integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 0,
  unlocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON public.user_characters(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_characters TO authenticated;
GRANT ALL ON public.user_characters TO service_role;

ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own characters" ON public.user_characters;
DROP POLICY IF EXISTS "Users can insert their own characters" ON public.user_characters;
DROP POLICY IF EXISTS "Users can update their own characters" ON public.user_characters;

CREATE POLICY "Users can view their own characters"
  ON public.user_characters FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.is_current_user_admin());

CREATE POLICY "Users can insert their own characters"
  ON public.user_characters FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own characters"
  ON public.user_characters FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);