
-- 1) Restrict login_logs INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert login logs" ON public.login_logs;

CREATE POLICY "Authenticated users can insert login logs"
ON public.login_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2) Lock down realtime.messages so users only receive their own row changes
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own topic messages" ON realtime.messages;
CREATE POLICY "Users read own topic messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = (auth.uid())::text
  OR realtime.topic() LIKE (auth.uid())::text || ':%'
);

DROP POLICY IF EXISTS "Users write own topic messages" ON realtime.messages;
CREATE POLICY "Users write own topic messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = (auth.uid())::text
  OR realtime.topic() LIKE (auth.uid())::text || ':%'
);
