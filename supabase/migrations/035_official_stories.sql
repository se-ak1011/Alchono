-- =============================================
-- 035 — Seed official-account video Stories
-- =============================================
-- Home "Stories" is just the shared+approved *video* moments from the community
-- feed. So an official account's approved video moment shows up as a Story with
-- no app change. This adds a small helper to turn an uploaded clip into one.
--
-- USAGE (in the Supabase SQL editor, after uploading the files):
--   1. Upload a video + its thumbnail to the 'moments' storage bucket under the
--      'shared/' folder (e.g. shared/calm-minute.mp4 and shared/calm-minute.jpg).
--      Use only clips you have the right to publish (your own, or a free-license
--      source such as Pexels / Pixabay / Coverr — CC0 / royalty-free).
--   2. Run, e.g.:
--        select seed_official_story(
--          'Good Things Department',      -- official account username
--          'shared/calm-minute.mp4',      -- video path in the moments bucket
--          'shared/calm-minute.jpg',      -- thumbnail path
--          'A calm minute. Nothing to do but watch.'  -- caption (optional)
--        );
--   Official usernames: 'Alchono', 'Good Things Department',
--   'The Night Shift', 'Community Starter'.

CREATE OR REPLACE FUNCTION seed_official_story(
  p_username TEXT,
  p_media_path TEXT,
  p_thumb_path TEXT,
  p_caption TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_id UUID;
BEGIN
  SELECT id INTO v_user FROM public.profiles WHERE username = p_username LIMIT 1;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No account found with username %', p_username;
  END IF;

  -- Curated/official content is trusted, so it's marked approved directly
  -- (it skips the AI moderation the member upload flow uses).
  INSERT INTO public.moments (
    user_id, media_path, media_type, thumb_path, caption,
    shared, anonymous, moderation_status, moderated_at
  )
  VALUES (
    v_user, p_media_path, 'video', p_thumb_path, p_caption,
    TRUE, FALSE, 'approved', NOW()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Only trusted server-side roles may seed official content.
REVOKE ALL ON FUNCTION seed_official_story(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION seed_official_story(TEXT, TEXT, TEXT, TEXT) TO service_role;
