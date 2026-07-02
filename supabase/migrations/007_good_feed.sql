-- =============================================
-- 007 — The Good Feed: admin-curated feel-good videos (YouTube embeds)
-- =============================================

CREATE TABLE IF NOT EXISTS good_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'wholesome' NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE good_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "good_feed_select" ON good_feed
  FOR SELECT TO authenticated USING (active = TRUE OR is_admin());

CREATE POLICY "good_feed_admin_insert" ON good_feed
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "good_feed_admin_update" ON good_feed
  FOR UPDATE USING (is_admin());

CREATE POLICY "good_feed_admin_delete" ON good_feed
  FOR DELETE USING (is_admin());

-- ---------------------------------------------
-- Seed content (curated July 2026). Content plays via YouTube, so there is
-- no hosting, bandwidth, or copyright exposure. Prune/extend from the
-- in-app admin screen.
-- ---------------------------------------------
INSERT INTO good_feed (youtube_id, title, category) VALUES
  -- Acts of kindness
  ('o8ojLhiRerY', 'Random acts of kindness that prove faith in humanity is restored', 'kindness'),
  ('LA-MWwGDixE', 'Random acts of kindness that will restore your faith in humanity', 'kindness'),
  ('xwYCTTaMewo', 'Wholesome videos that''ll restore your faith in humanity', 'kindness'),
  ('yTis5aIvmPE', 'Best acts of kindness — good people, good deeds #9', 'kindness'),
  ('qYoTsXe5xfM', 'Best acts of kindness — good people, good deeds #6', 'kindness'),
  -- Funny animals
  ('jUCv_oi0kDo', 'People vs animals — funny animal fails', 'animals'),
  ('KDhZRz08JFI', '30 minutes of the funniest animals', 'animals'),
  ('Px5nmExb-uw', 'Funny pet fails — best animal compilation', 'animals'),
  ('n6cFFhWdVG8', 'Hilarious animals falling over and wacky antics', 'animals'),
  ('U2GI0jovNqc', 'Top 100 ultimate funniest animal fails', 'animals'),
  ('isSPVKp2cFg', 'The funniest pet fails and cute animal compilation', 'animals'),
  ('UcUqb5xbR5k', 'Pets failing hilariously', 'animals'),
  -- Reunions
  ('IRBjXLGHyw4', 'Dogs lose it when their military heroes come home', 'reunions'),
  ('nDSthb2wOns', 'Dogs reacting to soldiers coming home', 'reunions'),
  ('d6kjZXwdyJs', 'Soldiers come home to dogs — The Dodo best of', 'reunions'),
  ('_63wXvrz7-0', 'Dogs lose it over military homecomings', 'reunions'),
  ('6iss5V9iyFI', 'Soldier comes home and surprises his dog', 'reunions'),
  ('ChBDkYPR9mk', 'Soldiers coming home surprise their kids', 'reunions'),
  -- Classic fails
  ('wZ_9KTAg1Yo', 'Best fails of the year (so far) — FailArmy', 'fails'),
  ('BNiTVsAlzlc', 'Best fails of the year — try not to laugh', 'fails'),
  ('mD_zdVZUYQs', 'Best fails of the year — try not to laugh!', 'fails'),
  ('-GJFSmpZjCw', 'Best fails of the year (so far) 2023', 'fails'),
  ('Igw90hTQXws', 'Best fails of the year — the craziest ever', 'fails'),
  ('d51diKTSi2M', 'Best fails of the year — unhinged chaos', 'fails'),
  -- Animal rescues
  ('hu17vmgBOF0', 'The most dramatic rescue dog transformations — The Dodo', 'rescues'),
  ('ksuKEz9YJvw', 'This rescue dog''s transformation will leave you speechless', 'rescues'),
  ('VgjNBR53Cgc', '3 incredible rescue dog transformations — The Dodo', 'rescues'),
  ('4oDQ6gPaGI4', 'A dog transformation you have to see to believe', 'rescues'),
  ('Ds2DK0deoHo', 'Grateful rescue cat''s stunning transformation', 'rescues'),
  ('AwzKmyqtmTM', '30+ minutes of the most heartwarming foster and adoption stories', 'rescues'),
  ('bvmvG7KNH9c', 'The happiest dog rescue stories — The Dodo', 'rescues'),
  ('uukUeIxEZfw', '30+ minutes of the most heartwarming second chances', 'rescues')
ON CONFLICT (youtube_id) DO NOTHING;
