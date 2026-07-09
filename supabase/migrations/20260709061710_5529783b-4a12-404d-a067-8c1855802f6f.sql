-- 1) Prevent is_admin self-escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Allow backend/service role (auth.uid() IS NULL) and existing admins.
    IF auth.uid() IS NOT NULL AND NOT public.is_current_user_admin() THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2) Hide correct_answer from public/auth reads via column-level grants
REVOKE SELECT ON public.quiz_questions FROM anon;
REVOKE SELECT ON public.quiz_questions FROM authenticated;

GRANT SELECT (
  id, question, options, category, difficulty, explanation,
  points, created_at, image_url, question_type
) ON public.quiz_questions TO anon;

GRANT SELECT (
  id, question, options, category, difficulty, explanation,
  points, created_at, image_url, question_type
) ON public.quiz_questions TO authenticated;

-- service_role retains full access for edge functions / admin RPCs
GRANT ALL ON public.quiz_questions TO service_role;