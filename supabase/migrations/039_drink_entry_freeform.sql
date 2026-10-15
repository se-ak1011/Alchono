-- =============================================
-- Drink diary — gentle, qualitative logging
-- =============================================
-- The "Tonight" page is now a handwritten diary: what you drank, roughly how
-- much, when, and anything else — awareness, not precise unit-counting. These
-- free-text columns sit alongside the existing units field (kept at 0 for
-- freeform entries) so the GP diary still works where units are known.

ALTER TABLE drink_entries
  ADD COLUMN IF NOT EXISTS amount_text   TEXT,     -- "roughly how much"
  ADD COLUMN IF NOT EXISTS when_text     TEXT,     -- "when"
  ADD COLUMN IF NOT EXISTS note          TEXT,     -- "anything else?"
  ADD COLUMN IF NOT EXISTS amount_unsure BOOLEAN DEFAULT FALSE NOT NULL;
