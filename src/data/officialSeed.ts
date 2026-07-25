/**
 * ALCHONO SEED PACK v1 — clearly-labelled official starter content.
 *
 * This isolated local-data fallback exists because the current schema requires
 * real auth-backed profiles for community authors. It never writes on launch,
 * never fabricates engagement, and can be removed once the idempotent admin
 * importer and four controlled official profiles are available.
 */
export const SEED_PACK_ID = 'alchono-seed-v1';

export const OFFICIAL_ACCOUNTS = {
  official_alchono: { id: '00000000-0000-4000-8000-000000000001', username: 'Alchono', handle: '@alchono' },
  good_things: { id: '00000000-0000-4000-8000-000000000002', username: 'Good Things Department', handle: '@goodthings' },
  night_shift: { id: '00000000-0000-4000-8000-000000000003', username: 'The Night Shift', handle: '@nightshift' },
  community_starter: { id: '00000000-0000-4000-8000-000000000004', username: 'Community Starter', handle: '@starttalking' },
} as const;

type OfficialAccountId = keyof typeof OFFICIAL_ACCOUNTS;

const TALK: Array<[OfficialAccountId, string]> = [
  ['community_starter', 'What is one completely ordinary thing that made today slightly better?'],
  ['night_shift', 'Tonight’s achievement: I washed one plate instead of declaring the entire kitchen legally deceased.'],
  ['good_things', 'Tell us something good that happened today. Tiny counts. Finding your keys absolutely counts.'],
  ['official_alchono', 'You do not need to solve the whole week tonight. What would make the next ten minutes easier?'],
  ['community_starter', 'Unpopular opinion: cancelling plans before you are already exhausted is a skill, not a failure.'],
  ['night_shift', 'Current status: emotionally supported by a mug I have reheated three times.'],
  ['good_things', 'What did you do today that future-you will quietly appreciate?'],
  ['community_starter', 'What is a harmless thing you are irrationally stubborn about?'],
  ['official_alchono', 'Check-in without the performance: good, bad, weird, numb, hopeful, annoyed — all valid answers.'],
  ['night_shift', 'The washing machine has finished. Whether the clothes ever leave it is a separate administrative matter.'],
  ['good_things', 'Today’s tiny win thread. Mine is opening the curtains before midday.'],
  ['community_starter', 'What song can change your mood within the first ten seconds?'],
  ['official_alchono', 'A difficult day is not evidence that you are going backwards.'],
  ['night_shift', 'I made tea and forgot it existed. A beloved household tradition.'],
  ['community_starter', 'What is something people call lazy that is actually energy management?'],
  ['good_things', 'Show us the best thing you have seen outside this week — sky, dog, weird leaf, anything.'],
  ['official_alchono', 'No inspirational speech today. Drink something, eat something, and be a person gently.'],
  ['community_starter', 'What is your most comforting boring meal?'],
  ['night_shift', 'I have reached the stage of the evening where moving the charger closer feels like a major infrastructure project.'],
  ['good_things', 'What made you laugh when you really did not expect to?'],
  ['community_starter', 'What small boundary has made your life noticeably easier?'],
  ['official_alchono', 'You are allowed to be proud of progress nobody else can see.'],
  ['night_shift', 'Reminder: staring into the fridge does not generate new food. Research remains ongoing.'],
  ['community_starter', 'What is one thing you wish people understood about starting again?'],
  ['good_things', 'Drop a photo of something ordinary that looks oddly beautiful today.'],
  ['official_alchono', 'You do not have to earn rest by becoming completely unusable first.'],
  ['community_starter', 'What is a very specific smell that instantly takes you somewhere else?'],
  ['night_shift', 'I successfully avoided a problem all day and can confirm it remained extremely available this evening.'],
  ['good_things', 'What is the nicest thing someone has done for you recently without making a big deal of it?'],
  ['community_starter', 'What is your current low-effort comfort watch?'],
  ['official_alchono', 'Some days the plan is growth. Some days the plan is simply not making things harder.'],
  ['night_shift', 'Dinner tonight is ingredients standing near each other with confidence.'],
  ['community_starter', 'What is one rule you have stopped forcing yourself to follow?'],
  ['good_things', 'Name one thing you are looking forward to, even if it is only going back to bed.'],
  ['official_alchono', 'A lapse, wobble or awful thought does not cancel every choice you made before it.'],
  ['community_starter', 'What advice sounded ridiculous until you actually needed it?'],
  ['night_shift', 'The house is quiet, the brain has opened seventeen tabs, and none of them can be closed.'],
  ['good_things', 'What is your pet’s most baffling daily ritual?'],
  ['community_starter', 'What is one thing you are learning to do badly instead of never doing at all?'],
  ['official_alchono', 'You are still allowed in the community on the days you have nothing encouraging to say.'],
];

// Ten launch posts make Talk feel useful immediately; the rest arrive one per
// day. Future records remain in the pack but are excluded until their time.
const ALL_OFFICIAL_TALK_POSTS = TALK.map(([authorId, content], index) => {
  const account = OFFICIAL_ACCOUNTS[authorId];
  const createdAt = index < 10
    ? Date.UTC(2026, 6, 20, 8) + index * 13 * 60 * 60 * 1000
    : Date.UTC(2026, 6, 26, 9) + (index - 10) * 24 * 60 * 60 * 1000;
  return {
    id: `seed_talk_${String(index + 1).padStart(3, '0')}`,
    user_id: account.id,
    created_at: new Date(createdAt).toISOString(),
    content,
    reactions: { heart: 0, clap: 0, handshake: 0 },
    is_anonymous: false,
    username: account.username,
    handle: account.handle,
    is_official: true,
    is_seed_content: true,
  };
});

export function getOfficialTalkPosts() {
  const now = Date.now();
  return ALL_OFFICIAL_TALK_POSTS
    .filter((post) => new Date(post.created_at).getTime() <= now)
    .reverse();
}

const THOUGHTS = [
  'What are you carrying today that does not need to be solved today?',
  'Which version of you needs a little less criticism right now?',
  'What would ‘enough’ look like for the next hour?',
  'Is this urgent, or is your nervous system simply loud?',
  'What are you doing out of habit that no longer helps?',
  'What is one kind thing you can make easier for tomorrow-you?',
  'What feeling are you trying to argue yourself out of?',
  'What would change if rest counted as part of the plan?',
  'What do you need more than advice right now?',
  'Where are you expecting perfection when honesty would do?',
  'What is one choice available to you in the next five minutes?',
  'What are you proud of surviving that nobody saw?',
  'Which expectation can be made smaller without being abandoned?',
  'What are you calling failure that may actually be information?',
  'What would you say to someone you loved in your exact situation?',
];

const GIGGLES = [
  'I am not procrastinating. I am waiting for the task to become emotionally available.',
  'My coping mechanism is saying ‘right’ before doing absolutely nothing.',
  'I cleaned one surface and now expect the household to nominate me for an award.',
  'The recipe said ‘serves four.’ It has wildly misunderstood the evening.',
  'My phone battery and I are both at 12% and refusing to discuss it.',
  'I love a fresh start, particularly when it begins tomorrow.',
  'Today’s cardio was looking for the thing that was in my hand.',
  'I opened the app to do one task and emerged with three screenshots and no memory of the task.',
  'The chair is not messy. It is a clothing-based filing system.',
  'I have two moods: ‘we can sort this’ and ‘the village must be abandoned.’',
  'I put something somewhere safe. It has entered witness protection.',
  'Resting is difficult because apparently I supervise myself badly.',
  'The good news is I made a list. The bad news is the list has become another responsibility.',
  'I am one minor inconvenience away from becoming folklore.',
  'I did not lose the plot. I placed it somewhere safe with the keys.',
];

function schedule<K extends 'thought' | 'giggle'>(items: string[], prefix: string, kind: K, start: string, intervalDays: number) {
  const startAt = new Date(start).getTime();
  return items.map((body, index) => ({
    id: `${prefix}_${String(index + 1).padStart(3, '0')}`,
    title: kind === 'thought' ? 'A moment to reflect' : 'The Night Shift',
    body,
    category: 'Official starter',
    kind,
    created_at: new Date(startAt + index * intervalDays * 86_400_000).toISOString(),
    is_official: true,
  }));
}

const ALL_OFFICIAL_THOUGHTS = schedule(THOUGHTS, 'seed_thought', 'thought', '2026-07-22T05:00:00Z', 1);
const ALL_OFFICIAL_GIGGLES = schedule(GIGGLES, 'seed_giggle', 'giggle', '2026-07-23T17:00:00Z', 1);

function liveItems<T extends { created_at: string }>(items: T[]) {
  const now = Date.now();
  return items.filter((item) => new Date(item.created_at).getTime() <= now).reverse();
}

export const getOfficialThoughts = () => liveItems(ALL_OFFICIAL_THOUGHTS);
export const getOfficialGiggles = () => liveItems(ALL_OFFICIAL_GIGGLES);
