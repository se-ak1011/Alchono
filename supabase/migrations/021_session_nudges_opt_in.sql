-- Make session "slow-down" nudges opt-IN.
--
-- These buzzes personalise to a user's loved ones ("Text Marta. Even just
-- 'hey'.") and keep firing for ~3 hours after any drinking session goes live.
-- Shipping them default-on ambushed testers who never chose them — the wrong
-- default for a recovery app. Flip the column default to FALSE and reset every
-- existing row so nobody is nudged until they deliberately enable
-- "Slow-down nudges" in Notification Settings.
ALTER TABLE notification_preferences
  ALTER COLUMN session_nudges SET DEFAULT FALSE;

UPDATE notification_preferences
  SET session_nudges = FALSE
  WHERE session_nudges IS TRUE;
