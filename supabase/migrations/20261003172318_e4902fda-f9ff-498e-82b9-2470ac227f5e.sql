CREATE TABLE public.marketing_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_email_templates TO authenticated;
GRANT ALL ON public.marketing_email_templates TO service_role;
ALTER TABLE public.marketing_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.marketing_email_templates FOR ALL TO authenticated
  USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  template_id uuid REFERENCES public.marketing_email_templates(id) ON DELETE SET NULL,
  audience text,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sending',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns FOR ALL TO authenticated
  USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_unsubscribed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.marketing_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_mkt_tpl_updated BEFORE UPDATE ON public.marketing_email_templates FOR EACH ROW EXECUTE FUNCTION public.marketing_set_updated_at();
CREATE TRIGGER trg_mkt_cmp_updated BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.marketing_set_updated_at();

INSERT INTO public.marketing_email_templates (name, subject, html_content) VALUES
('Download the Mobile App', 'Take CuizIN with you, {{display_name}} 📱',
'<div style="font-family:Georgia,serif;max-width:560px;margin:auto;background:#1a1410;color:#f5e6c8;padding:32px;border-radius:12px;border:2px solid #c9a227"><h1 style="color:#e8c35a;margin:0 0 12px">Hail, {{display_name}}!</h1><p>Your {{points}} points await. The CuizIN app brings faster quizzes, daily quests and alerts so you never miss a challenge.</p><p style="text-align:center;margin:28px 0"><a href="{{app_download_url}}" style="background:#c9a227;color:#1a1410;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Get the App</a></p><p style="font-size:12px;color:#a89470">Prefer the web? <a href="{{web_url}}" style="color:#e8c35a">Play at cuiz.in</a></p></div>'),
('Your Streak Awaits', '{{display_name}}, the Royal Council misses you ⚔️',
'<div style="font-family:Georgia,serif;max-width:560px;margin:auto;background:#1a1410;color:#f5e6c8;padding:32px;border-radius:12px;border:2px solid #c9a227"><h1 style="color:#e8c35a;margin:0 0 12px">The kingdom calls, {{display_name}}</h1><p>A few minutes of trivia a day keeps your knowledge sharp. Today''s daily challenge is ready — come claim your points.</p><p style="text-align:center;margin:28px 0"><a href="{{web_url}}/daily" style="background:#c9a227;color:#1a1410;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Play Today''s Challenge</a></p></div>'),
('New Quests Unlocked', 'New quests have arrived in CuizIN 🏰',
'<div style="font-family:Georgia,serif;max-width:560px;margin:auto;background:#1a1410;color:#f5e6c8;padding:32px;border-radius:12px;border:2px solid #c9a227"><h1 style="color:#e8c35a;margin:0 0 12px">Fresh quests, {{display_name}}!</h1><p>New categories and empire quests have been added. Test your knowledge and climb the leaderboard.</p><p style="text-align:center;margin:28px 0"><a href="{{web_url}}/categories" style="background:#c9a227;color:#1a1410;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Explore Quests</a></p></div>');