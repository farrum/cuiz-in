
DROP POLICY IF EXISTS "Authenticated users can insert login logs" ON public.login_logs;

CREATE POLICY "Authenticated users can insert own login logs"
ON public.login_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (auth.uid())::text
      AND p.username = login_logs.username
  )
);
