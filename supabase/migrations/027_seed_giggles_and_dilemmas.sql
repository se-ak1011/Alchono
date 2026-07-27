-- 027 — Seed the "Food for the ..." feeds with on-brand starter content.
--
-- Food for the Giggles: original petty-revenge / malicious-compliance short
-- stories (funny, wholesome, never mean, nothing about alcohol or recovery).
-- Food for Thought: original AITA-style moral dilemmas — everyday, genuinely
-- ambiguous, non-triggering — that pair with the who-was-wrong vote.
--
-- These run as the migration superuser so they bypass RLS and land as
-- published rows straight away. Fixed ids make the insert idempotent. The AI
-- generator adds more of the same style over time.

INSERT INTO curated_stories (id, kind, title, body, category, published) VALUES
  ('20000000-0000-4000-8000-000000000001', 'giggle', 'The Assigned Seat',
   'A bloke on the train kept "reserving" the seat next to him with his bag, sighing at anyone who came near. When the conductor came round, I asked, very politely, whether the bag had bought a ticket. It had not. The conductor made him move it. The bag and I have not spoken since.',
   'Petty revenge', TRUE),
  ('20000000-0000-4000-8000-000000000002', 'giggle', 'Exactly As Requested',
   'My manager said reports must be "exactly one page, no exceptions." So I shrank the font until my twelve pages of data technically fit on one, unreadable page. He asked for a normal version by lunch. I said I would need an exception. He went a fascinating colour.',
   'Malicious compliance', TRUE),
  ('20000000-0000-4000-8000-000000000003', 'giggle', 'The Neighbourly Hedge',
   'A neighbour insisted my hedge was two inches over the line and demanded I "cut it back to the exact boundary." I did. Precisely. Now there is a hedge-shaped gap that frames his very ugly bins perfectly, visible from his own kitchen window. He has since asked if I could let it grow back.',
   'Petty revenge', TRUE),
  ('20000000-0000-4000-8000-000000000004', 'giggle', 'Full Name Basis',
   'A cold caller refused to stop using my first name like we were old friends. So I started using his full corporate script back at him, word for word, in the same chirpy voice. He asked if I was "mocking the call." I said I was simply matching his energy. He hung up. Small victories.',
   'Petty revenge', TRUE),
  ('20000000-0000-4000-8000-000000000005', 'giggle', 'The Letter Of The Law',
   'New office rule: "no personal items on desks whatsoever." Fine. I put my stapler, my mug and my family photo into a labelled cardboard box and placed the box on the floor beside my desk. Technically compliant. The rule was quietly revised within a week to specify "keep it reasonable." I framed the old memo. It is on the floor.',
   'Malicious compliance', TRUE),
  ('20000000-0000-4000-8000-000000000006', 'giggle', 'Return To Sender',
   'My flatmate kept "borrowing" my nice pens and never returning them. So I bought a pack of pens that look identical but run out after about three words. My good pens are now safe in a drawer, and he thinks he is cursed. I have not corrected him.',
   'Petty revenge', TRUE),
  ('20000000-0000-4000-8000-000000000007', 'giggle', 'The Scenic Route',
   'A driver behind me was leaning on his horn the second the light went amber. So I drove at the exact, lawful speed limit, indicated early, and came to a full and thoughtful stop at every single amber for the next mile. I have never felt so calm. He has never been so furious.',
   'Petty revenge', TRUE),
  ('20000000-0000-4000-8000-000000000008', 'giggle', 'As Per My Last Email',
   'A colleague kept taking credit for my ideas in meetings. So I started emailing my suggestions to the whole team first, "just to get them on record." Funny how the ideas dried up on his end. Now he forwards my emails and adds "great thinking." Progress, of a sort.',
   'Malicious compliance', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dilemmas (id, title, story, published) VALUES
  ('30000000-0000-4000-8000-000000000001', 'The Birthday Bill',
   'It was my friend''s birthday, so eight of us went for dinner. Most people had a couple of drinks and shared big plates; I had a starter and a tap water because money is tight this month. When the bill came, someone suggested we "just split it evenly, it''s easier." My share would have been nearly double what I actually ate.\n\nI quietly said I''d rather just pay for mine, and put down what I owed plus a bit for the tip. A couple of people looked a bit awkward and the birthday friend went quiet.\n\nI wasn''t trying to make a scene, but now I''m wondering if I made the night about money when I should have just swallowed it.', TRUE),
  ('30000000-0000-4000-8000-000000000002', 'The Spare Room',
   'My sister and her husband are visiting for a week and assumed they''d stay in my spare room. The thing is, I''ve been using that room as the only quiet space I have, and I told them I''d happily help pay for a nearby B&B instead so we all get our space.\n\nShe was hurt and said family doesn''t make family book a hotel. I said I loved having them here all day, I just needed my evenings.\n\nThey booked the B&B, but it''s been frosty since. Was I unreasonable to protect one room?', TRUE),
  ('30000000-0000-4000-8000-000000000003', 'The Regift',
   'A friend gave me a candle for my birthday. I don''t burn candles, so a month later I passed it on, unopened, to another friend who loves them. The first friend spotted it on the second friend''s shelf and recognised the little tag.\n\nShe was upset that I''d "thrown away" her gift. I said I''d rather it be used and loved than sit in my cupboard forever.\n\nShe thinks that''s cold. I think a candle should get to be a candle. Am I in the wrong here?', TRUE),
  ('30000000-0000-4000-8000-000000000004', 'The Group Holiday',
   'Six of us booked a holiday and agreed to split costs evenly. Two of the group then picked the most expensive room in the villa and upgraded the hire car to a convertible, saying "we''re all sharing anyway."\n\nI said sharing meant the base costs, not their upgrades, and that I''d pay my even share of the original plan but not for the convertible I didn''t ask for.\n\nNow I''m "the one making it complicated." But I never agreed to the fancy version. Am I being tight, or fair?', TRUE),
  ('30000000-0000-4000-8000-000000000005', 'The Borrowed Drill',
   'My neighbour borrowed my drill eight months ago and never brought it back. I asked twice, politely, and each time he said "oh yes, soon." Last week I saw it in his open garage, so I just took it back.\n\nHe came round annoyed that I''d "gone into his space without asking." I said it was my drill and I''d asked for it twice.\n\nHe''s technically right that I walked onto his drive uninvited. But it was mine. Who''s actually in the wrong?', TRUE),
  ('30000000-0000-4000-8000-000000000006', 'The Quiet Wedding',
   'We had a small wedding and could only afford forty seats. We didn''t invite my cousin, who I''m not close to and haven''t spoken to in years. My aunt found out and said it was a "deliberate insult to the whole family."\n\nI said it wasn''t personal, we just had a tiny budget and picked the people in our daily lives.\n\nNow half the family thinks we snubbed him on purpose. Should we have stretched to invite someone we barely know to keep the peace?', TRUE),
  ('30000000-0000-4000-8000-000000000007', 'The Dinner Phone',
   'A friend came round for dinner I''d spent the afternoon cooking, then spent most of the meal replying to messages under the table. Halfway through I stopped talking mid-sentence to see how long it''d take him to notice. It took a while.\n\nWhen he looked up I said, lightly, that I''d wait until he was free. He got embarrassed and said I''d "made it weird."\n\nMaybe I did make a point of it. But I''d cooked for hours. Was that fair, or petty?', TRUE),
  ('30000000-0000-4000-8000-000000000008', 'The Shared Playlist',
   'My flatmate and I share a speaker in the kitchen. He started removing my songs from the shared playlist because they "didn''t fit the vibe," but got annoyed when I skipped his. I said if he could curate, so could I, and skipped away.\n\nHe says it''s his job because he made the playlist; I say it''s shared because it''s the shared speaker in the shared kitchen.\n\nIt''s a small thing, but neither of us will back down. Who''s being unreasonable?', TRUE)
ON CONFLICT (id) DO NOTHING;
