CREATE TABLE public.guest_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  event_type text NOT NULL,
  path text,
  question_id uuid,
  correct boolean,
  points numeric,
  country text,
  device text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_events_created_at ON public.guest_events (created_at DESC);
CREATE INDEX idx_guest_events_session ON public.guest_events (session_id);
CREATE INDEX idx_guest_events_type ON public.guest_events (event_type);

GRANT SELECT ON public.guest_events TO authenticated;
GRANT ALL ON public.guest_events TO service_role;

ALTER TABLE public.guest_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view guest events"
  ON public.guest_events FOR SELECT
  USING (is_current_user_admin());