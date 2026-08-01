-- =============================================
-- 037 — Opt-in to receiving message requests
-- =============================================
-- Showing your username (posting non-anonymously) is about courage; accepting
-- a 1:1 message is about capacity. They're separate choices. This flag lets a
-- member post under their real name — brave, out loud — while still being
-- unreachable by DMs, e.g. sharing a dark thought they don't want to *talk*
-- about. Default OFF: private-first, same spirit as the composer defaulting to
-- anonymous. The '✉ message' door only appears on posters who opted in; even
-- then, each request is still individually accepted or denied.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepts_messages BOOLEAN NOT NULL DEFAULT false;

-- Expose it on the public view so the room knows who is reachable. (Runs after
-- 036, so the presence columns already exist to list here.)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, username, avatar_url, presence_status, status_message, accepts_messages
  FROM profiles;

REVOKE ALL ON public_profiles FROM anon;
GRANT SELECT ON public_profiles TO authenticated;
