-- =============================================
-- 012 — Counsellor directory: public listings, practice links
-- =============================================

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT TRUE NOT NULL;

-- Verified + listed professionals are publicly browsable by members.
-- (Members stay unsearchable; professionals are businesses who opted in.)
CREATE POLICY "pro_select_verified_listed" ON professionals
  FOR SELECT USING (verified = TRUE AND listed = TRUE);

-- Professionals can edit their own practice details…
CREATE POLICY "pro_update_self" ON professionals
  FOR UPDATE USING (auth.uid() = user_id);

-- …but can never flip their own verified flag: a trigger silently
-- preserves it unless the caller is admin.
CREATE OR REPLACE FUNCTION protect_verified_flag()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NOT is_admin() THEN
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_protect_verified ON professionals;
CREATE TRIGGER professionals_protect_verified
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION protect_verified_flag();
