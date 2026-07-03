-- =============================================
-- 009 — Rural flag on mentor profiles
-- =============================================
-- profiles.preferences is owner-only under RLS, so a mentor's isolation
-- flag is copied onto their (publicly readable) mentor profile when they
-- save it. Lets isolated mentees find mentors who get rural recovery.
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS is_rural BOOLEAN DEFAULT FALSE NOT NULL;
