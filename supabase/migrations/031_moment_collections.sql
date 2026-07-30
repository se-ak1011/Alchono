-- 031 — Scrapbooks: let a person organise their own moments into named albums.
--
-- A single optional text label per moment (the scrapbook it belongs to). NULL =
-- unfiled. Kept deliberately simple — no join table, no ordering — so the
-- gallery can group/filter by it without new plumbing. Private to the owner;
-- the community feed never reads this column.

ALTER TABLE moments ADD COLUMN IF NOT EXISTS collection TEXT;
