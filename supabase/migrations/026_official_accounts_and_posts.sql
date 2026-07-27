-- 026 — Bring the four official community accounts into existence.
--
-- WHY: 025 tried to insert the official starter posts, but guarded the insert
-- with `JOIN profiles p ON p.id = o.user_id` — so it only lands posts whose
-- author profile already exists. Those profiles were never created, so 025
-- inserted ZERO rows. The app then fell back to local `officialSeed.ts`
-- placeholders (is_seed_content), and the UI hard-disables reactions AND
-- comments on any seed content. Net effect: with only seed posts visible,
-- every reaction/comment button is disabled — nothing is interactive.
--
-- This migration creates the four accounts as real, auth-backed profiles so
-- 025's (and this file's) post insert actually lands. The official posts then
-- become normal database rows: reactable and commentable like any other post.
--
-- These are display-only SYSTEM authors. They never sign in — we only need a
-- backing auth.users row to satisfy profiles.id -> auth.users(id) and the
-- community_posts author FK. The password is random and unusable.

-- 1) Auth users (idempotent). The on_auth_user_created trigger auto-creates a
--    matching public.profiles row (id only) for each.
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'official.alchono@accounts.alchono.app',
   crypt(gen_random_uuid()::text, gen_salt('bf')), NOW(), '{"provider":"system","providers":["system"]}', '{"official":true}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'official.goodthings@accounts.alchono.app',
   crypt(gen_random_uuid()::text, gen_salt('bf')), NOW(), '{"provider":"system","providers":["system"]}', '{"official":true}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'official.nightshift@accounts.alchono.app',
   crypt(gen_random_uuid()::text, gen_salt('bf')), NOW(), '{"provider":"system","providers":["system"]}', '{"official":true}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'official.starter@accounts.alchono.app',
   crypt(gen_random_uuid()::text, gen_salt('bf')), NOW(), '{"provider":"system","providers":["system"]}', '{"official":true}', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 2) Give each profile its public display name. The trigger created the row
--    with a NULL username; set the names the seed pack already uses so
--    non-anonymous official posts render correctly via public_profiles.
INSERT INTO public.profiles (id, username, full_name, onboarding_completed)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Alchono', 'Alchono', TRUE),
  ('00000000-0000-4000-8000-000000000002', 'Good Things Department', 'Good Things Department', TRUE),
  ('00000000-0000-4000-8000-000000000003', 'The Night Shift', 'The Night Shift', TRUE),
  ('00000000-0000-4000-8000-000000000004', 'Community Starter', 'Community Starter', TRUE)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  onboarding_completed = TRUE;

-- 3) Land the official starter posts now that their authors exist. Same rows
--    and ids as 025 so this is idempotent whether or not 025 partially ran.
--    Future-dated posts stay hidden client-side (created_at <= now filter)
--    until their day, preserving the one-per-day drip.
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
