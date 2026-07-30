-- =============================================
-- 034 — Personal recovery plan ("My plan")
-- =============================================
-- A calm, proactive plan the member writes once and pulls up on a hard night:
-- their reasons, their people, their go-to moves, and their early warning signs.
-- Distinct from the reactive urge flow. Stored as a small JSON blob on the
-- member's own profile row (already RLS-protected), following the existing
-- profiles.preferences pattern. Graceful: the feature only writes this once used.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_plan JSONB;
