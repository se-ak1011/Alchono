-- Independent toggle for the "slow down between drinks" session nudges.
-- Default on (opt-out), like the other supportive reminders.
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS session_nudges BOOLEAN DEFAULT TRUE NOT NULL;
