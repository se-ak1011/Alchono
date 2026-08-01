-- =============================================
-- 036 — MSN-style manual presence status
-- =============================================
-- A status the member *chooses* (not auto-detected): Online / Busy / Away /
-- Appear offline, plus an optional short status message. It lives on the
-- profile and is read by everyone via the identity-safe public_profiles view,
-- exactly like username — so the community room can show a coloured dot and
-- label next to each named poster. No presence/heartbeat infra: the user is
-- in control, which is both the nostalgic MSN feel and the private one.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'online'
    CHECK (presence_status IN ('online', 'busy', 'away', 'offline')),
  ADD COLUMN IF NOT EXISTS status_message TEXT
    CHECK (status_message IS NULL OR char_length(status_message) <= 80);

-- Expose the status columns on the public view others read. (profiles itself
-- is owner-only under RLS; this view is how usernames already reach the room.)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, username, avatar_url, presence_status, status_message FROM profiles;

-- Recreating the view can reset grants — re-assert them.
REVOKE ALL ON public_profiles FROM anon;
GRANT SELECT ON public_profiles TO authenticated;

-- Owners already update their own profile row via the existing
-- "update own profile" RLS policy, which covers these new columns. No new
-- policy needed: a user can only ever set their *own* status.
