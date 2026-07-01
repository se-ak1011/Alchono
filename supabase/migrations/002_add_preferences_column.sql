-- Add preferences JSONB column to profiles
-- The TypeScript types already include this field; this migration aligns the DB schema.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT NULL;
