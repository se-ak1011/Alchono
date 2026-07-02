-- =============================================
-- 004 — Messaging, mentor inbox support, safeguarding
-- =============================================

-- ---------------------------------------------
-- public_profiles — safe, minimal view of profiles
-- ---------------------------------------------
-- profiles has owner-only RLS, so joins like profiles(username) return NULL
-- for anyone else. This view (security definer by default) exposes ONLY
-- identity-safe columns to signed-in users: usernames on mentor cards,
-- community posts, and message threads.
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, username, avatar_url FROM profiles;

REVOKE ALL ON public_profiles FROM anon;
GRANT SELECT ON public_profiles TO authenticated;

-- ---------------------------------------------
-- user_blocks — either side of a connection can block the other
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_all_own" ON user_blocks
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- ---------------------------------------------
-- messages — 1:1 thread per accepted mentor request
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES mentor_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants of the request can read the thread.
CREATE POLICY "messages_select_participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentor_requests r
      WHERE r.id = request_id
        AND (r.requester_id = auth.uid() OR r.mentor_id = auth.uid())
    )
  );

-- Only participants can write, only into accepted threads, only as
-- themselves, and never across a block in either direction.
CREATE POLICY "messages_insert_participants" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM mentor_requests r
      WHERE r.id = request_id
        AND r.status = 'accepted'
        AND (r.requester_id = auth.uid() OR r.mentor_id = auth.uid())
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id = r.requester_id AND b.blocked_id = r.mentor_id)
             OR (b.blocker_id = r.mentor_id AND b.blocked_id = r.requester_id)
        )
    )
  );

-- The recipient can mark messages read (any participant may update rows
-- they didn't send; used only for read_at).
CREATE POLICY "messages_update_read" ON messages
  FOR UPDATE USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM mentor_requests r
      WHERE r.id = request_id
        AND (r.requester_id = auth.uid() OR r.mentor_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_request_created
  ON messages (request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (request_id) WHERE read_at IS NULL;

-- ---------------------------------------------
-- reports — safeguarding/dispute queue (reviewed via dashboard)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES mentor_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' NOT NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_own" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON reports (status, created_at DESC);

-- ---------------------------------------------
-- Realtime — messages arrive live in open threads
-- ---------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
