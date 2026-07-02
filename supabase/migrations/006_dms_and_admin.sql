-- =============================================
-- 006 — Member DMs (request model) + admin role
-- =============================================

-- ---------------------------------------------
-- admins — grantable ONLY from the dashboard/SQL editor.
-- RLS has no insert/update/delete policies on purpose: clients can never
-- grant themselves admin. Users can only read their own row (an "am I
-- admin?" check).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_self" ON admins
  FOR SELECT USING (auth.uid() = user_id);

-- SECURITY DEFINER so other tables' policies can check admin status without
-- being blocked by the admins table's own RLS.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- Admin can see and work the safeguarding queue.
CREATE POLICY "reports_admin_select" ON reports
  FOR SELECT USING (is_admin());

CREATE POLICY "reports_admin_update" ON reports
  FOR UPDATE USING (is_admin());

-- Admin can see blocks (dispute context). Never editable by admin — blocks
-- belong to the users who made them.
CREATE POLICY "blocks_admin_select" ON user_blocks
  FOR SELECT USING (is_admin());

-- ---------------------------------------------
-- dm_threads — member-to-member message requests.
-- Requester may send up to 3 messages while pending; nothing more until the
-- recipient accepts. Declined threads accept no further messages.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS dm_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE (requester_id, recipient_id),
  CHECK (requester_id <> recipient_id)
);

ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_threads_select_participants" ON dm_threads
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- No new requests across a block, in either direction.
CREATE POLICY "dm_threads_insert_requester" ON dm_threads
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks b
      WHERE (b.blocker_id = requester_id AND b.blocked_id = recipient_id)
         OR (b.blocker_id = recipient_id AND b.blocked_id = requester_id)
    )
  );

-- Only the recipient decides.
CREATE POLICY "dm_threads_update_recipient" ON dm_threads
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dm_threads_recipient
  ON dm_threads (recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_threads_requester
  ON dm_threads (requester_id, status, created_at DESC);

-- ---------------------------------------------
-- dm_messages
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ
);

ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_messages_select_participants" ON dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_threads t
      WHERE t.id = thread_id
        AND (t.requester_id = auth.uid() OR t.recipient_id = auth.uid())
    )
  );

-- The request model, enforced server-side:
--   accepted  -> both participants can message
--   pending   -> only the requester, capped at 3 messages total
--   declined  -> nobody
-- Plus: never across a block.
CREATE POLICY "dm_messages_insert_rules" ON dm_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM dm_threads t
      WHERE t.id = thread_id
        AND (t.requester_id = auth.uid() OR t.recipient_id = auth.uid())
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id = t.requester_id AND b.blocked_id = t.recipient_id)
             OR (b.blocker_id = t.recipient_id AND b.blocked_id = t.requester_id)
        )
        AND (
          t.status = 'accepted'
          OR (
            t.status = 'pending'
            AND t.requester_id = auth.uid()
            AND (SELECT count(*) FROM dm_messages m WHERE m.thread_id = t.id) < 3
          )
        )
    )
  );

CREATE POLICY "dm_messages_update_read" ON dm_messages
  FOR UPDATE USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM dm_threads t
      WHERE t.id = thread_id
        AND (t.requester_id = auth.uid() OR t.recipient_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created
  ON dm_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_messages_unread
  ON dm_messages (thread_id) WHERE read_at IS NULL;

-- Live delivery
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
