CREATE OR REPLACE FUNCTION public.claim_referral(p_ref_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid text;
  v_referrer_id text;
  v_referrer_name text;
  v_member_name text;
  v_member_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  uid := auth.uid()::text;

  IF p_ref_code IS NULL OR btrim(p_ref_code) = '' THEN
    RETURN jsonb_build_object('error', 'Missing referral code');
  END IF;

  SELECT id, COALESCE(display_name, username)
  INTO v_referrer_id, v_referrer_name
  FROM public.profiles
  WHERE lower(username) = lower(btrim(p_ref_code))
     OR id = btrim(p_ref_code)
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Referrer not found');
  END IF;

  IF v_referrer_id = uid THEN
    RETURN jsonb_build_object('error', 'You cannot refer yourself');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_referrals WHERE referred_id = uid) THEN
    RETURN jsonb_build_object('success', true, 'already_linked', true);
  END IF;

  SELECT COALESCE(display_name, username), email
  INTO v_member_name, v_member_email
  FROM public.profiles WHERE id = uid;

  IF v_member_name IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not ready');
  END IF;

  INSERT INTO public.user_referrals
    (referrer_id, referrer_name, referred_id, referred_name, referred_email, date, status)
  VALUES
    (v_referrer_id, v_referrer_name, uid, v_member_name, v_member_email,
     to_char(now(), 'YYYY-MM-DD'), 'active');

  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;