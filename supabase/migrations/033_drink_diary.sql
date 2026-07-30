-- =============================================
-- 033 — Drinks diary (units), for the GP-style summary
-- =============================================
-- The app already counts drinks per session; this adds the one thing a GP's
-- paper "Drinks diary" needs that a plain count can't give: UNITS. Each logged
-- drink becomes one row carrying its NHS unit value (captured via a preset
-- picker, so the member never does the maths). Daily/weekly totals and the
-- daily average are then just a sum. Purely additive — the existing
-- drinking_sessions.drinks_count counter is untouched.

CREATE TABLE IF NOT EXISTS drink_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Optional link to the live session it was logged during.
  session_id UUID REFERENCES drinking_sessions(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  drink_type TEXT NOT NULL,          -- preset key, e.g. 'pint_high'
  drink_label TEXT,                  -- human label at time of logging
  units NUMERIC NOT NULL DEFAULT 0,  -- NHS units for this single drink
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE drink_entries ENABLE ROW LEVEL SECURITY;

-- Owner can do anything with their own entries; no one else can see them.
CREATE POLICY "drink_entries_all_own" ON drink_entries
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS drink_entries_user_time
  ON drink_entries (user_id, occurred_at DESC);
