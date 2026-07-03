-- =============================================
-- 011 — Professional (counsellor) portal
-- =============================================

-- Professionals self-register but start UNVERIFIED. Only the admin can
-- flip verified (there is no client update policy for it). Unverified
-- professionals cannot send client requests or read any trends.
CREATE TABLE IF NOT EXISTS professionals (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  org TEXT,
  role_title TEXT,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_select_self" ON professionals
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "pro_insert_self_unverified" ON professionals
  FOR INSERT WITH CHECK (auth.uid() = user_id AND verified = FALSE);

CREATE POLICY "pro_admin_update" ON professionals
  FOR UPDATE USING (is_admin());

-- Quick role flag so the app can route professionals to their portal.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT FALSE NOT NULL;

-- ---------------------------------------------
-- Client links: the professional asks (having been GIVEN the member's
-- exact username or QR), the member consents in-app, and can revoke.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS client_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE (professional_id, member_id),
  CHECK (professional_id <> member_id)
);
ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_links_select_either" ON client_links
  FOR SELECT USING (auth.uid() = professional_id OR auth.uid() = member_id);

-- Only VERIFIED professionals can even ask.
CREATE POLICY "client_links_insert_verified_pro" ON client_links
  FOR INSERT WITH CHECK (
    professional_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.user_id = auth.uid() AND p.verified = TRUE
    )
  );

-- The member decides; the member can also revoke later.
CREATE POLICY "client_links_update_member" ON client_links
  FOR UPDATE USING (member_id = auth.uid());

CREATE POLICY "client_links_delete_either" ON client_links
  FOR DELETE USING (auth.uid() = professional_id OR auth.uid() = member_id);

-- ---------------------------------------------
-- The professional's entire window: content-free 30-day trends.
-- Requires: link accepted, caller is that professional, and verified.
-- Never journal text, never messages, never AI conversations.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_client_trends(p_link_id UUID)
RETURNS TABLE (
  checked_in_today BOOLEAN,
  last_active DATE,
  af_days_30 INT,
  urges_beaten_30 INT,
  urges_faced_30 INT,
  sessions_30 INT,
  journal_notes_30 INT,
  top_mood TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH link AS (
    SELECT l.member_id FROM client_links l
    JOIN professionals p ON p.user_id = l.professional_id AND p.verified = TRUE
    WHERE l.id = p_link_id
      AND l.status = 'accepted'
      AND l.professional_id = auth.uid()
  )
  SELECT
    EXISTS (SELECT 1 FROM daily_checkins c, link
            WHERE c.user_id = link.member_id AND c.created_at::date = CURRENT_DATE),
    (SELECT GREATEST(
        (SELECT max(c.created_at)::date FROM daily_checkins c, link WHERE c.user_id = link.member_id),
        (SELECT max(u.created_at)::date FROM urge_events u, link WHERE u.user_id = link.member_id),
        (SELECT max(j.created_at)::date FROM journal_notes j, link WHERE j.user_id = link.member_id)
     )),
    (SELECT count(*)::int FROM alcohol_free_days a, link
      WHERE a.user_id = link.member_id AND a.date >= CURRENT_DATE - 30),
    (SELECT count(*)::int FROM urge_events u, link
      WHERE u.user_id = link.member_id AND u.outcome = 'passed'
        AND u.created_at >= CURRENT_DATE - 30),
    (SELECT count(*)::int FROM urge_events u, link
      WHERE u.user_id = link.member_id AND u.created_at >= CURRENT_DATE - 30),
    (SELECT count(*)::int FROM drinking_sessions s, link
      WHERE s.user_id = link.member_id AND s.started_at >= CURRENT_DATE - 30),
    (SELECT count(*)::int FROM journal_notes j, link
      WHERE j.user_id = link.member_id AND j.created_at >= CURRENT_DATE - 30),
    (SELECT c.mood FROM daily_checkins c, link
      WHERE c.user_id = link.member_id AND c.created_at >= CURRENT_DATE - 30
      GROUP BY c.mood ORDER BY count(*) DESC LIMIT 1)
  FROM link;
$$;
