-- =============================================
-- Mentor profile — richer, forum-style fields
-- =============================================
-- The "Become a mentor" page edits a small personal forum profile. `bio` is the
-- "a bit about me" blurb; these add the rest so the directory can show what a
-- mentor offers at a glance, and the fuller profile before a request.

ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS offer       TEXT,  -- "What I can offer"
  ADD COLUMN IF NOT EXISTS comfortable TEXT,  -- "What I'm comfortable talking about"
  ADD COLUMN IF NOT EXISTS around      TEXT;  -- "When I'm usually around"
