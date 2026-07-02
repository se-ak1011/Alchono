-- =============================================
-- 005 — Victories: urge outcomes + persisted alcohol-free days
-- =============================================

-- Every completed urge flow gets recorded: the app's most important event.
CREATE TABLE IF NOT EXISTS urge_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('passed', 'drank'))
);

ALTER TABLE urge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "urges_all_own" ON urge_events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_urges_user_created
  ON urge_events (user_id, created_at DESC);

-- "Alcohol-free today" was device-local state only — lost on reinstall and
-- invisible to insights. One row per marked day.
CREATE TABLE IF NOT EXISTS alcohol_free_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, date)
);

ALTER TABLE alcohol_free_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "af_days_all_own" ON alcohol_free_days
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_af_days_user_date
  ON alcohol_free_days (user_id, date DESC);
