-- =============================================
-- 010 — Trusted person, urge durations, timeline milestones
-- =============================================

-- ---------------------------------------------
-- Urge durations: how long each urge actually lasted.
-- ---------------------------------------------
ALTER TABLE urge_events
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

-- ---------------------------------------------
-- "I need support" taps — powers the 🔴 asked-for-support signal.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS support_taps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE support_taps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_taps_all_own" ON support_taps
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- Trusted person links. The member (user_id) invites by exact username;
-- the trusted person accepts. Either side can end it at any time.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS trusted_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trusted_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, trusted_user_id),
  CHECK (user_id <> trusted_user_id)
);
ALTER TABLE trusted_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trusted_select_either" ON trusted_links
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trusted_user_id);

CREATE POLICY "trusted_insert_member" ON trusted_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trusted_update_trusted" ON trusted_links
  FOR UPDATE USING (auth.uid() = trusted_user_id);

CREATE POLICY "trusted_delete_either" ON trusted_links
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = trusted_user_id);

-- The ONLY window a trusted person gets: four booleans about today.
-- Never journals, never messages, never AI conversations, never counts.
CREATE OR REPLACE FUNCTION get_trusted_signals(p_link_id UUID)
RETURNS TABLE (
  checked_in_today BOOLEAN,
  urge_beaten_today BOOLEAN,
  rough_day BOOLEAN,
  asked_for_support BOOLEAN
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH link AS (
    SELECT user_id FROM trusted_links
    WHERE id = p_link_id
      AND status = 'accepted'
      AND trusted_user_id = auth.uid()
  )
  SELECT
    EXISTS (SELECT 1 FROM daily_checkins c, link
            WHERE c.user_id = link.user_id AND c.created_at::date = CURRENT_DATE),
    EXISTS (SELECT 1 FROM urge_events u, link
            WHERE u.user_id = link.user_id AND u.outcome = 'passed'
              AND u.created_at::date = CURRENT_DATE),
    EXISTS (SELECT 1 FROM daily_checkins c, link
            WHERE c.user_id = link.user_id AND c.created_at::date = CURRENT_DATE
              AND c.mood IN ('low', 'anxious', 'angry', 'lonely', 'frustrated', 'exhausted')),
    EXISTS (SELECT 1 FROM support_taps s, link
            WHERE s.user_id = link.user_id AND s.created_at::date = CURRENT_DATE)
  FROM link;
$$;

-- ---------------------------------------------
-- Timeline: user-pinned recovery milestones (derived ones are computed
-- in-app from existing data).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  happened_on DATE NOT NULL
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_all_own" ON milestones
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_date
  ON milestones (user_id, happened_on DESC);
