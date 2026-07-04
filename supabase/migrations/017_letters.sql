-- =============================================
-- 017 — Letters From Your Past Self
-- =============================================
-- A time capsule, not a journal. The user writes to their future self and
-- picks when it should return. The app surfaces a letter once its deliver_at
-- has passed — the user never knows exactly when one will come back. It should
-- feel like hearing from someone who genuinely understands them, because it is
-- themselves. Never gamified: no badges, no streaks.

CREATE TABLE IF NOT EXISTS letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  body TEXT NOT NULL,
  -- When Future You should receive this.
  deliver_at TIMESTAMPTZ NOT NULL,
  -- Set the moment the letter is opened, so it surfaces exactly once.
  delivered_at TIMESTAMPTZ,
  -- How it landed: 'needed_this' | 'wrote_back' | 'keep_moving'. Never a score.
  reaction TEXT
);

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

-- A letter is entirely private to its author — no cross-user window ever.
CREATE POLICY "letters_all_own" ON letters
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Find the letters that are due but not yet delivered, cheaply.
CREATE INDEX IF NOT EXISTS idx_letters_due
  ON letters (user_id, deliver_at)
  WHERE delivered_at IS NULL;

-- The archive, newest first.
CREATE INDEX IF NOT EXISTS idx_letters_user_created
  ON letters (user_id, created_at DESC);
