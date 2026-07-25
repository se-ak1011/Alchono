-- 023 — Lightweight Talk conversations and report-led moderation.

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Recover posts created under earlier approval-based deployments.
UPDATE community_posts
SET moderation_status = 'published'
WHERE moderation_status IN ('pending', 'under_review', 'awaiting_review');

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 500)
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_visible" ON community_comments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM community_posts p WHERE p.id = post_id AND p.removed_at IS NULL)
  );
CREATE POLICY "comments_insert_own" ON community_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION enforce_talk_comment_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Serialize concurrent submissions for this member/post pair.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.post_id::text), hashtext(NEW.user_id::text));
  IF (SELECT count(*) FROM community_comments
      WHERE post_id = NEW.post_id AND user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'You have reached the 3 comment limit for this post.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER talk_comment_limit
  BEFORE INSERT ON community_comments
  FOR EACH ROW EXECUTE FUNCTION enforce_talk_comment_limit();
CREATE INDEX IF NOT EXISTS idx_community_comments_post_created
  ON community_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS community_post_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('Spam', 'Harassment', 'Hate speech', 'Self-harm concern', 'Misinformation', 'Other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ignored', 'removed')),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE community_post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_reports_insert_own" ON community_post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "post_reports_select_own_or_admin" ON community_post_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR is_admin());
CREATE POLICY "post_reports_admin_update" ON community_post_reports
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE INDEX IF NOT EXISTS idx_post_reports_status_created
  ON community_post_reports(status, created_at DESC);

CREATE POLICY "posts_admin_update" ON community_posts
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Nearby ordering remains, but removed content can never leak through the RPC.
CREATE OR REPLACE FUNCTION community_feed_nearby(p_limit INT, p_offset INT)
RETURNS SETOF community_posts
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH me AS (
    SELECT location_lat AS lat, location_lng AS lng FROM profiles WHERE id = auth.uid()
  )
  SELECT p.* FROM community_posts p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  CROSS JOIN me
  WHERE auth.uid() IS NOT NULL
    AND p.removed_at IS NULL AND p.moderation_status = 'published'
  ORDER BY
    CASE WHEN me.lat IS NOT NULL AND pr.location_lat IS NOT NULL
      AND ((pr.location_lat - me.lat)^2 + (pr.location_lng - me.lng)^2) < 0.25
      THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Lets an authenticated client persist a generated preview for a legacy shared
-- video, but only once and only at the expected thumbnail path.
CREATE OR REPLACE FUNCTION save_legacy_moment_thumbnail(p_moment_id UUID, p_thumb_path TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE moments SET thumb_path = p_thumb_path
  WHERE id = p_moment_id AND shared = TRUE AND media_type = 'video'
    AND thumb_path IS NULL
    AND p_thumb_path = 'shared/' || p_moment_id::text || '_legacy_t.jpg'
    AND EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'moments' AND o.name = p_thumb_path);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION save_legacy_moment_thumbnail(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION save_legacy_moment_thumbnail(UUID, TEXT) TO authenticated;
