-- =============================================
-- 014 — Reset a member account without deleting auth.users
-- =============================================
-- Packaged, reusable version of the manual reset SQL. Runs as SECURITY
-- DEFINER, so it can clear voice-journal storage too (which fails when run
-- as the member themselves). Service-role only.

CREATE OR REPLACE FUNCTION reset_my_account(email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT u.id
  INTO v_user_id
  FROM auth.users AS u
  WHERE lower(u.email) = lower($1)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for email %', $1;
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'voice-journals'
    AND (storage.foldername(name))[1] = v_user_id::text;

  DELETE FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION reset_my_account(TEXT) IS
  'Deletes all profile-owned data for an auth user, recreates a blank profile for re-onboarding, and leaves auth.users untouched. Ready-to-run example: SELECT reset_my_account(''drainedstore@gmail.com'');';

REVOKE ALL ON FUNCTION reset_my_account(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reset_my_account(TEXT) TO service_role;

-- Ready-to-run example:
-- SELECT reset_my_account('drainedstore@gmail.com');
