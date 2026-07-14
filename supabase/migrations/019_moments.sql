-- =============================================
-- 019 — Community moments (self-uploaded photos/videos)
-- =============================================
-- A self-contained feed, by members for members — it replaces the old
-- YouTube-embed good_feed. Media is PRIVATE by default. A user can choose to
-- share a moment to the feed with a caption, as their username or anonymously.
-- Shared media is auto-screened by AI (moderate-moment edge function) before it
-- ever appears. Privacy & anonymity first.

CREATE TABLE IF NOT EXISTS moments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Path in the private 'moments' storage bucket.
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',   -- 'photo' | 'video'
  -- Video first-frame thumbnail (feed grid + what the moderator screens).
  thumb_path TEXT,
  caption TEXT,
  shared BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  -- 'private' (never shared) | 'pending' | 'approved' | 'rejected'
  moderation_status TEXT NOT NULL DEFAULT 'private',
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT
);

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- Owner can do anything with their own moments (this powers the private
-- gallery). The public feed is served ONLY by the service-role feed edge
-- function — never a broad SELECT here — so anonymity can be enforced
-- server-side (a shared row's user_id never leaves the server for anon posts).
CREATE POLICY "moments_all_own" ON moments
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_moments_user_created
  ON moments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_feed
  ON moments (created_at DESC)
  WHERE shared = TRUE AND moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_moments_pending
  ON moments (created_at)
  WHERE shared = TRUE AND moderation_status = 'pending';

-- ---------------------------------------------
-- Private storage bucket. Nothing here is public; the feed and moderation
-- edge functions use the service role to read shared media, and the owner
-- reads their own private media via signed URLs.
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('moments', 'moments', false)
ON CONFLICT (id) DO NOTHING;

-- Upload: authenticated users may write to their own {uid}/ prefix (private
-- media) or to the shared/ prefix (shared media — no user-id in the path so
-- anonymous posts reveal nothing).
CREATE POLICY "moments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'moments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[1] = 'shared'
    )
  );

-- Read your own private media (the gallery). Shared media is read server-side
-- (feed/moderation functions, service role), so it needs no read policy here.
CREATE POLICY "moments_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'moments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete your own private media.
CREATE POLICY "moments_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'moments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
