-- =============================================
-- 008 — Nearby community (private location), voice journal, peer city reveal
-- =============================================

-- ---------------------------------------------
-- Coarse location on profiles. Rounded to ~11km client-side before saving;
-- profiles RLS is owner-only, so coordinates are never readable by others.
-- Proximity ordering happens inside a SECURITY DEFINER function that never
-- returns location values.
-- ---------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Nearby-first community feed: posts from roughly nearby people (~50km)
-- surface first, newest first within each bucket. No distances or
-- coordinates are ever returned.
CREATE OR REPLACE FUNCTION community_feed_nearby(p_limit INT, p_offset INT)
RETURNS SETOF community_posts
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH me AS (
    SELECT location_lat AS lat, location_lng AS lng
    FROM profiles WHERE id = auth.uid()
  )
  SELECT p.*
  FROM community_posts p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  CROSS JOIN me
  WHERE auth.uid() IS NOT NULL
  ORDER BY
    CASE
      WHEN me.lat IS NOT NULL AND pr.location_lat IS NOT NULL
        AND ((pr.location_lat - me.lat)^2 + (pr.location_lng - me.lng)^2) < 0.25
      THEN 0
      ELSE 1
    END ASC,
    p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- City reveal after a mutual DM accept: participants of an ACCEPTED thread
-- can see each other's city text (never coordinates).
CREATE OR REPLACE FUNCTION get_peer_city(p_thread_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT NULLIF(TRIM((pr.preferences->>'city')), '')
  FROM dm_threads t
  JOIN profiles pr ON pr.id = CASE
    WHEN t.requester_id = auth.uid() THEN t.recipient_id
    WHEN t.recipient_id = auth.uid() THEN t.requester_id
  END
  WHERE t.id = p_thread_id
    AND t.status = 'accepted'
    AND (t.requester_id = auth.uid() OR t.recipient_id = auth.uid());
$$;

-- ---------------------------------------------
-- Freeform journal: text (keyboard dictation works natively) and voice notes.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS journal_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  text TEXT,
  audio_path TEXT,
  duration_seconds INT
);

ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_notes_all_own" ON journal_notes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_notes_user_created
  ON journal_notes (user_id, created_at DESC);

-- Private bucket for voice notes; files live under {user_id}/...
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-journals', 'voice-journals', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "voice_journals_own_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-journals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "voice_journals_own_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-journals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "voice_journals_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-journals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
