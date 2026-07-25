-- 025 — One reaction per member/post, interactive official posts, and Moment realtime.

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS community_post_reactions (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('heart', 'clap', 'handshake')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE community_post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_reactions_select" ON community_post_reactions
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "community_reactions_insert_own" ON community_post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_reactions_update_own" ON community_post_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TestFlight reactions predate reaction identity and cannot be attributed safely.
-- Reset the counters once so every displayed reaction is backed by one member row.
UPDATE community_posts
SET reactions = '{"heart":0,"clap":0,"handshake":0}'::jsonb;

CREATE OR REPLACE FUNCTION react_to_community_post(p_post_id UUID, p_reaction TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_author UUID;
  previous_reaction TEXT;
  updated JSONB;
BEGIN
  IF auth.uid() IS NULL OR p_reaction NOT IN ('heart', 'clap', 'handshake') THEN
    RAISE EXCEPTION 'invalid reaction' USING ERRCODE = 'check_violation';
  END IF;
  SELECT user_id INTO post_author FROM community_posts
   WHERE id = p_post_id AND removed_at IS NULL AND moderation_status = 'published'
   FOR UPDATE;
  IF post_author IS NULL THEN RAISE EXCEPTION 'post unavailable' USING ERRCODE = 'no_data_found'; END IF;
  IF post_author = auth.uid() THEN RAISE EXCEPTION 'You cannot react to your own post.' USING ERRCODE = 'check_violation'; END IF;

  SELECT reaction INTO previous_reaction FROM community_post_reactions
   WHERE post_id = p_post_id AND user_id = auth.uid();
  IF previous_reaction IS NULL THEN
    INSERT INTO community_post_reactions(post_id, user_id, reaction) VALUES (p_post_id, auth.uid(), p_reaction);
  ELSIF previous_reaction <> p_reaction THEN
    UPDATE community_post_reactions SET reaction = p_reaction
     WHERE post_id = p_post_id AND user_id = auth.uid();
  END IF;

  SELECT jsonb_build_object(
    'heart', count(*) FILTER (WHERE reaction = 'heart'),
    'clap', count(*) FILTER (WHERE reaction = 'clap'),
    'handshake', count(*) FILTER (WHERE reaction = 'handshake')
  ) INTO updated FROM community_post_reactions WHERE post_id = p_post_id;
  UPDATE community_posts SET reactions = updated WHERE id = p_post_id;
  RETURN jsonb_build_object('reactions', updated, 'my_reaction', p_reaction);
END;
$$;
REVOKE ALL ON FUNCTION react_to_community_post(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION react_to_community_post(UUID, TEXT) TO authenticated;

-- Official posts become normal persisted posts when their controlled profiles exist.
WITH official_posts(id, user_id, created_at, content, is_anonymous, is_official, moderation_status) AS (
VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '2026-07-20T08:00:00Z', 'What is one completely ordinary thing that made today slightly better?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '2026-07-20T21:00:00Z', 'Tonight’s achievement: I washed one plate instead of declaring the entire kitchen legally deceased.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '2026-07-21T10:00:00Z', 'Tell us something good that happened today. Tiny counts. Finding your keys absolutely counts.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '2026-07-21T23:00:00Z', 'You do not need to solve the whole week tonight. What would make the next ten minutes easier?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', '2026-07-22T12:00:00Z', 'Unpopular opinion: cancelling plans before you are already exhausted is a skill, not a failure.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000003', '2026-07-23T01:00:00Z', 'Current status: emotionally supported by a mug I have reheated three times.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000002', '2026-07-23T14:00:00Z', 'What did you do today that future-you will quietly appreciate?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000004', '2026-07-24T03:00:00Z', 'What is a harmless thing you are irrationally stubborn about?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001', '2026-07-24T16:00:00Z', 'Check-in without the performance: good, bad, weird, numb, hopeful, annoyed — all valid answers.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000003', '2026-07-25T05:00:00Z', 'The washing machine has finished. Whether the clothes ever leave it is a separate administrative matter.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000002', '2026-07-26T09:00:00Z', 'Today’s tiny win thread. Mine is opening the curtains before midday.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000004', '2026-07-27T09:00:00Z', 'What song can change your mood within the first ten seconds?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', '2026-07-28T09:00:00Z', 'A difficult day is not evidence that you are going backwards.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000003', '2026-07-29T09:00:00Z', 'I made tea and forgot it existed. A beloved household tradition.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000004', '2026-07-30T09:00:00Z', 'What is something people call lazy that is actually energy management?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000002', '2026-07-31T09:00:00Z', 'Show us the best thing you have seen outside this week — sky, dog, weird leaf, anything.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000001', '2026-08-01T09:00:00Z', 'No inspirational speech today. Drink something, eat something, and be a person gently.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000004', '2026-08-02T09:00:00Z', 'What is your most comforting boring meal?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000003', '2026-08-03T09:00:00Z', 'I have reached the stage of the evening where moving the charger closer feels like a major infrastructure project.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000002', '2026-08-04T09:00:00Z', 'What made you laugh when you really did not expect to?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000004', '2026-08-05T09:00:00Z', 'What small boundary has made your life noticeably easier?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', '2026-08-06T09:00:00Z', 'You are allowed to be proud of progress nobody else can see.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000003', '2026-08-07T09:00:00Z', 'Reminder: staring into the fridge does not generate new food. Research remains ongoing.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000004', '2026-08-08T09:00:00Z', 'What is one thing you wish people understood about starting again?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000002', '2026-08-09T09:00:00Z', 'Drop a photo of something ordinary that looks oddly beautiful today.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000001', '2026-08-10T09:00:00Z', 'You do not have to earn rest by becoming completely unusable first.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000004', '2026-08-11T09:00:00Z', 'What is a very specific smell that instantly takes you somewhere else?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000003', '2026-08-12T09:00:00Z', 'I successfully avoided a problem all day and can confirm it remained extremely available this evening.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000002', '2026-08-13T09:00:00Z', 'What is the nicest thing someone has done for you recently without making a big deal of it?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000004', '2026-08-14T09:00:00Z', 'What is your current low-effort comfort watch?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000001', '2026-08-15T09:00:00Z', 'Some days the plan is growth. Some days the plan is simply not making things harder.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000003', '2026-08-16T09:00:00Z', 'Dinner tonight is ingredients standing near each other with confidence.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000004', '2026-08-17T09:00:00Z', 'What is one rule you have stopped forcing yourself to follow?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000002', '2026-08-18T09:00:00Z', 'Name one thing you are looking forward to, even if it is only going back to bed.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000001', '2026-08-19T09:00:00Z', 'A lapse, wobble or awful thought does not cancel every choice you made before it.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000004', '2026-08-20T09:00:00Z', 'What advice sounded ridiculous until you actually needed it?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000037', '00000000-0000-4000-8000-000000000003', '2026-08-21T09:00:00Z', 'The house is quiet, the brain has opened seventeen tabs, and none of them can be closed.', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000038', '00000000-0000-4000-8000-000000000002', '2026-08-22T09:00:00Z', 'What is your pet’s most baffling daily ritual?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000039', '00000000-0000-4000-8000-000000000004', '2026-08-23T09:00:00Z', 'What is one thing you are learning to do badly instead of never doing at all?', false, true, 'published'),
  ('10000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', '2026-08-24T09:00:00Z', 'You are still allowed in the community on the days you have nothing encouraging to say.', false, true, 'published')
)
INSERT INTO community_posts (id, user_id, created_at, content, is_anonymous, is_official, moderation_status)
SELECT o.id::uuid, o.user_id::uuid, o.created_at::timestamptz, o.content, o.is_anonymous, o.is_official, o.moderation_status
FROM official_posts o JOIN profiles p ON p.id = o.user_id::uuid
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content, created_at = EXCLUDED.created_at,
  user_id = EXCLUDED.user_id, is_official = TRUE;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_post_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE moments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
