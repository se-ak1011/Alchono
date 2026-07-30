-- 032 — "The zine" newsletter opt-in.
--
-- A single boolean on the profile. Opt-in is off by default and fully the
-- member's choice. To send an issue, an admin exports the emails of profiles
-- where newsletter_opt_in = TRUE (emails live in auth.users, joined server-side).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
