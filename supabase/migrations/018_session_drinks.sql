-- =============================================
-- 018 — Drinks logged within a session
-- =============================================
-- A gentle, optional count of drinks in an active session. Not a scoreboard —
-- it exists so a drink can be logged in one tap (or via an iOS App Intent /
-- Siri / Back Tap, without opening the app) and be there when the app reopens.
-- Existing session logic is unchanged; this only adds a counter.

ALTER TABLE drinking_sessions
  ADD COLUMN IF NOT EXISTS drinks_count INT NOT NULL DEFAULT 0;
