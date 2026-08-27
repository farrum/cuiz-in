CREATE TABLE IF NOT EXISTS public.client_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,
  task_key text,
  app_version text,
  app_platform text,
  user_agent text,
  user_id text
);

GRANT SELECT ON public.client_diagnostics TO authenticated;
GRANT ALL ON public.client_diagnostics TO service_role;

ALTER TABLE public.client_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view client diagnostics"
ON public.client_diagnostics
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE INDEX IF NOT EXISTS idx_client_diagnostics_occurred_at
  ON public.client_diagnostics (occurred_at DESC);

CREATE OR REPLACE FUNCTION public.log_client_diagnostic(
  p_event text,
  p_task_key text DEFAULT NULL,
  p_user_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hdrs jsonb;
BEGIN
  BEGIN
    hdrs := COALESCE(NULLIF(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    hdrs := '{}'::jsonb;
  END;

  BEGIN
    INSERT INTO public.client_diagnostics (event, task_key, app_version, app_platform, user_agent, user_id)
    VALUES (
      p_event,
      p_task_key,
      hdrs->>'x-app-version',
      hdrs->>'x-app-platform',
      left(COALESCE(hdrs->>'user-agent', ''), 400),
      COALESCE(p_user_id, auth.uid()::text)
    );

    IF random() < 0.02 THEN
      DELETE FROM public.client_diagnostics WHERE occurred_at < now() - interval '30 days';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_diagnostic(text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_user_task_progress_task_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parsed_task_id uuid;
BEGIN
  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.task_id = 'daily_tribute_login' THEN
    PERFORM public.log_client_diagnostic('legacy_task_key', NEW.task_id, NEW.user_id);
    RETURN NEW;
  END IF;

  BEGIN
    parsed_task_id := NEW.task_id::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      PERFORM public.log_client_diagnostic('invalid_task_key', NEW.task_id, NEW.user_id);
      RAISE EXCEPTION 'Invalid task identifier'
        USING ERRCODE = '23514';
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.empire_tasks WHERE id = parsed_task_id
  ) THEN
    RAISE EXCEPTION 'Task does not exist'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_client_diagnostics(p_days integer DEFAULT 7)
RETURNS TABLE(app_version text, app_platform text, event text, hits bigint, last_seen timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(d.app_version, 'unknown (legacy client)') AS app_version,
         COALESCE(d.app_platform, 'unknown') AS app_platform,
         d.event,
         count(*)::bigint AS hits,
         max(d.occurred_at) AS last_seen
  FROM public.client_diagnostics d
  WHERE public.is_current_user_admin()
    AND d.occurred_at >= now() - (GREATEST(LEAST(COALESCE(p_days, 7), 90), 1) || ' days')::interval
  GROUP BY 1, 2, 3
  ORDER BY 5 DESC;
$$;
