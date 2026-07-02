-- Goals table — referenced by the app (useGoals hook) but missing from 001.
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  text TEXT NOT NULL,
  target_date DATE,
  completed_at TIMESTAMPTZ
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_all_own" ON goals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals (user_id, created_at);
