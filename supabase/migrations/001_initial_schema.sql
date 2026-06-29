-- =============================================
-- Alchono – Initial Database Schema
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- profiles
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  sober_since DATE,
  recovery_goal TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_mentor BOOLEAN DEFAULT FALSE NOT NULL,
  mentor_recovery_level TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- daily_checkins
-- =============================================
CREATE TABLE daily_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  mood TEXT NOT NULL,
  mood_emoji TEXT NOT NULL,
  notes TEXT
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_all_own" ON daily_checkins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_checkins_user_created ON daily_checkins (user_id, created_at DESC);

-- =============================================
-- drinking_sessions
-- =============================================
CREATE TABLE drinking_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  paused_count INTEGER DEFAULT 0 NOT NULL,
  notes TEXT
);

ALTER TABLE drinking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_all_own" ON drinking_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_started ON drinking_sessions (user_id, started_at DESC);

-- =============================================
-- journal_entries
-- =============================================
CREATE TABLE journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  triggers TEXT[] DEFAULT '{}' NOT NULL,
  affected_others TEXT[] DEFAULT '{}' NOT NULL,
  notes TEXT,
  drinking_session_id UUID REFERENCES drinking_sessions(id) ON DELETE SET NULL
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_all_own" ON journal_entries
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_journal_user_created ON journal_entries (user_id, created_at DESC);

-- =============================================
-- community_posts
-- =============================================
CREATE TABLE community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{"heart":0,"clap":0,"handshake":0}' NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE NOT NULL
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_all" ON community_posts
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "posts_insert_own" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_posts_created ON community_posts (created_at DESC);

-- =============================================
-- mentor_profiles
-- =============================================
CREATE TABLE mentor_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  recovery_level TEXT NOT NULL,
  bio TEXT,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  total_sessions INTEGER DEFAULT 0 NOT NULL
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentors_select_available" ON mentor_profiles
  FOR SELECT TO authenticated USING (is_available = TRUE OR auth.uid() = user_id);

CREATE POLICY "mentors_manage_own" ON mentor_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- mentor_requests
-- =============================================
CREATE TABLE mentor_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  message TEXT,
  CONSTRAINT unique_pending_request UNIQUE (requester_id, mentor_id, status)
);

ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_select_own" ON mentor_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = mentor_id
  );

CREATE POLICY "requests_insert_own" ON mentor_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "requests_update_mentor" ON mentor_requests
  FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = requester_id);

-- =============================================
-- ai_conversations
-- =============================================
CREATE TABLE ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  messages JSONB DEFAULT '[]' NOT NULL,
  session_type TEXT DEFAULT 'general' NOT NULL
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conv_all_own" ON ai_conversations
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- notification_preferences
-- =============================================
CREATE TABLE notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_checkin BOOLEAN DEFAULT TRUE NOT NULL,
  drinking_reminders BOOLEAN DEFAULT TRUE NOT NULL,
  milestone_alerts BOOLEAN DEFAULT TRUE NOT NULL,
  community_updates BOOLEAN DEFAULT FALSE NOT NULL,
  morning_reflection BOOLEAN DEFAULT TRUE NOT NULL,
  push_token TEXT
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_own" ON notification_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create notification preferences on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- =============================================
-- Updated at trigger helper
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_ai_conv_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
