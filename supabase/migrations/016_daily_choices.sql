-- =============================================
-- 016 — Today I Chose: identity over streaks
-- =============================================
-- Every evening the user records the choices they made — one row per choice.
-- Over months this becomes hundreds of positive decisions: proof that
-- recovery is built one choice at a time, not measured by an unbroken streak.

CREATE TABLE IF NOT EXISTS daily_choices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  choice TEXT NOT NULL
);

ALTER TABLE daily_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "choices_all_own" ON daily_choices
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_choices_user_created
  ON daily_choices (user_id, created_at DESC);
