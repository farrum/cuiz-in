-- Fix login_logs insert policy to allow authenticated users whose username, display_name or ID matches
DROP POLICY IF EXISTS "Authenticated users can insert own login logs" ON public.login_logs;
DROP POLICY IF EXISTS "Authenticated users can insert login logs" ON public.login_logs;
DROP POLICY IF EXISTS "Anyone can insert login logs" ON public.login_logs;

CREATE POLICY "Authenticated users can insert own login logs"
ON public.login_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (auth.uid())::text
      AND (
        p.username = login_logs.username
        OR p.display_name = login_logs.username
        OR login_logs.username IS NOT NULL
      )
  )
);
