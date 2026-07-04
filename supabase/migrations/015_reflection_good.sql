-- =============================================
-- 015 — Reflections capture the good, not just the hard
-- =============================================
-- A daily reflection should hold space for what went well — good days and
-- got-through-it days matter as much as the difficult ones. These tags feed a
-- "Good things" view in Patterns, a counterweight to the trigger chart.

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS went_well TEXT[] DEFAULT '{}'::text[] NOT NULL;
