-- Create function to ping sitemap when content changes
CREATE OR REPLACE FUNCTION public.ping_sitemap_on_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the ping-sitemap edge function in the background
  PERFORM net.http_post(
    url := 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/ping-sitemap',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco"}'::jsonb,
    body := jsonb_build_object('reason', TG_TABLE_NAME || '_' || TG_OP)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for blog_posts
DROP TRIGGER IF EXISTS ping_sitemap_on_blog_change ON public.blog_posts;
CREATE TRIGGER ping_sitemap_on_blog_change
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.ping_sitemap_on_content_change();

-- Create trigger for faqs
DROP TRIGGER IF EXISTS ping_sitemap_on_faq_change ON public.faqs;
CREATE TRIGGER ping_sitemap_on_faq_change
AFTER INSERT OR UPDATE OR DELETE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.ping_sitemap_on_content_change();

-- Create trigger for quiz_questions (only on INSERT to avoid too many pings)
DROP TRIGGER IF EXISTS ping_sitemap_on_quiz_change ON public.quiz_questions;
CREATE TRIGGER ping_sitemap_on_quiz_change
AFTER INSERT ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.ping_sitemap_on_content_change();