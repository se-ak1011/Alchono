-- 029 — "Deep" dilemmas: philosophical thought experiments alongside the
-- everyday AITA ones. These are binary ("would you?") with a reflective payoff
-- shown after voting — meant to make you question yourself, not judge someone.

ALTER TABLE dilemmas
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'aita',
  ADD COLUMN IF NOT EXISTS option_a TEXT,
  ADD COLUMN IF NOT EXISTS option_b TEXT,
  ADD COLUMN IF NOT EXISTS reflection TEXT;

-- Deep dilemmas record a binary a/b vote instead of the four AITA choices.
ALTER TABLE dilemma_votes DROP CONSTRAINT IF EXISTS dilemma_votes_choice_check;
ALTER TABLE dilemma_votes ADD CONSTRAINT dilemma_votes_choice_check
  CHECK (choice IN ('op_wrong', 'they_wrong', 'nobody', 'everyone', 'a', 'b'));

-- Seed the deep set. Dollar-quoted strings so the prose needs no escaping.
INSERT INTO dilemmas (id, kind, title, story, option_a, option_b, reflection, published) VALUES
  ('31000000-0000-4000-8000-000000000001', 'deep',
   $md$The Runaway Trolley$md$,
   $md$A runaway trolley is hurtling toward five people tied to the track. You are standing beside a lever. Pull it, and the trolley switches to a side track where it will kill one person instead. Do nothing, and the five die. Your hand is on the lever.$md$,
   $md$Pull the lever$md$, $md$Do nothing$md$,
   $md$Most people pull it — five lives for one feels like simple maths. But notice what changed: doing nothing lets fate act, while pulling makes you the direct cause of a death that would not otherwise have happened. Where you drew that line says a lot about whether you judge yourself by outcomes, or by your own hand.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000002', 'deep',
   $md$The Footbridge$md$,
   $md$Same runaway trolley, five people about to die. This time you are on a footbridge above the track, beside a large stranger. The only way to stop the trolley is to push them off the bridge into its path — their body will stop it, saving the five, but killing them. The maths is identical to the lever.$md$,
   $md$Push them$md$, $md$Do not push$md$,
   $md$Almost everyone who pulled the lever refuses to push here — yet it is the same trade, one life for five. The difference is your hands. Using a person as the thing that stops the trolley feels different from flipping a switch. That flinch is not irrational; it is the part of you that refuses to treat a human being as a mere means, even for a good outcome.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000003', 'deep',
   $md$The Experience Machine$md$,
   $md$A machine can give you a lifetime of perfect, convincing experiences — every joy, success and love you could want, indistinguishable from real life. Once you plug in you will never know it is not real, and never want to leave. Outside, your real body floats quietly in a tank.$md$,
   $md$Plug in$md$, $md$Stay in reality$md$,
   $md$Most people refuse — which is strange, if pleasure were all that mattered. It suggests we want our joys to be earned and true, not merely felt; that we would rather a harder real life than a flawless fake one. Whatever you chose quietly reveals what you think a good life is actually for.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000004', 'deep',
   $md$The Ring That Hides You$md$,
   $md$You find a ring that makes you completely invisible and untraceable whenever you wish. No act you commit could ever be seen, proven, or punished, and no one would ever know. You could take anything, go anywhere, do anything, with total certainty of never being caught.$md$,
   $md$I would stay who I am$md$, $md$I would do things I now do not$md$,
   $md$This is one of the oldest questions there is: is your goodness real, or is it a fear of getting caught? If the ring would not change you, your morality is truly your own. If it would — even a little — then some of what you call principle is really just the presence of witnesses. Neither answer is entirely comfortable.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000005', 'deep',
   $md$The Kind Lie$md$,
   $md$A close friend has spent ten years and their savings on a novel, and finally hands it to you, glowing with hope, asking honestly what you think. You have read it. It is heartfelt but mediocre — and, as far as you can tell, never going to sell.$md$,
   $md$Tell a kind lie$md$, $md$Tell the honest truth$md$,
   $md$There is no clean answer — one path protects their heart, the other respects them enough to be honest. Whichever way you leaned shows which you hold higher when the two collide: kindness or truth. The hard part is that a good person could choose either, and both will cost something.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000006', 'deep',
   $md$The Promise to the Dead$md$,
   $md$Your closest friend, on their deathbed, made you promise to give their entire fortune to a stranger they named, with no explanation. They are gone now, and no one else knows the promise was ever made. The money could instead transform the lives of people you love, or fund real good in the world. The stranger, as far as you can tell, needs nothing.$md$,
   $md$Keep the promise$md$, $md$Do more good with it$md$,
   $md$A promise to someone who can never know if you broke it — is it still binding? If you would keep it anyway, your word means something even with no one left to enforce it. If you would redirect the money toward greater good, you value the outcome over the vow. Both are defensible, which is exactly what makes it sit under your skin.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000007', 'deep',
   $md$The Memory Pill$md$,
   $md$You are offered a pill that erases one genuine memory of your choosing, forever — the single worst thing you have done, the one you cannot forgive yourself for. You would feel lighter, freed of the guilt. But the version of you that learned and grew from that regret would, in part, be erased along with it.$md$,
   $md$Take the pill$md$, $md$Keep the memory$md$,
   $md$Guilt is painful, but it is also the ledger of who we have become. Erase the wound and you may erase the lesson stitched into it. Whether you would let it go or hold on says how you relate to your own past — as a weight to escape, or as the raw material of who you are now.$md$,
   TRUE),
  ('31000000-0000-4000-8000-000000000008', 'deep',
   $md$The Distant Button$md$,
   $md$A stranger you will never meet, on the other side of the world, will quietly die. In return you receive something you have wanted your whole life — enough that it would change everything. No one will ever connect the death to you. You will never see it, hear of it, or feel it. Only you will ever know the choice was yours.$md$,
   $md$I would never press it$md$, $md$I am not sure I would not$md$,
   $md$The unease of the button is how easily distance dissolves it. We would never harm someone in front of us for a prize, yet a life far enough away can start to feel like an abstraction. The unsettling question is not really whether you would press it — it is whether some quiet part of you understands why someone might.$md$,
   TRUE)
ON CONFLICT (id) DO NOTHING;
