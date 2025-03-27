
-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    user_id TEXT REFERENCES public.profiles(id),
    data JSONB DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read notifications
CREATE POLICY "Admin users can read notifications" 
ON public.admin_notifications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create trigger to notify admins of new notifications
CREATE OR REPLACE FUNCTION notify_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'admin_notification',
    json_build_object(
      'id', NEW.id,
      'type', NEW.type,
      'message', NEW.message,
      'user_id', NEW.user_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_notification_trigger
AFTER INSERT ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION notify_admin_notification();
