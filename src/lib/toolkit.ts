/**
 * The Toolkit — Alchono's self-help resource library.
 *
 * Organised into categories rather than one long scroll. Same warm,
 * second-person, non-clinical voice: no lectures, no judgement, no
 * streak-shaming. Static content, no backend.
 */

export type ToolkitCategory =
  | 'understand'
  | 'in-the-moment'
  | 'triggers'
  | 'planning-ahead'
  | 'relationships'
  | 'identity'
  | 'stress'
  | 'sleep'
  | 'after-a-slip'
  | 'motivation';

export const CATEGORY_META: Record<
  ToolkitCategory,
  { label: string; blurb: string }
> = {
  understand: { label: 'Understand', blurb: 'Make sense of what’s going on.' },
  'in-the-moment': { label: 'In the moment', blurb: 'For right now, when it’s loud.' },
  triggers: { label: 'Triggers', blurb: 'Spot them, plan around them.' },
  'planning-ahead': { label: 'Planning ahead', blurb: 'Set future-you up to win.' },
  relationships: { label: 'Relationships', blurb: 'The people around it.' },
  identity: { label: 'Identity', blurb: 'Who you’re becoming.' },
  stress: { label: 'Stress', blurb: 'When the day is a lot.' },
  sleep: { label: 'Sleep', blurb: 'Rest, without the nightcap.' },
  'after-a-slip': { label: 'After a slip', blurb: 'Get back up, no shame.' },
  motivation: { label: 'Motivation', blurb: 'Why you started.' },
};

// Order the category grid is shown in.
export const CATEGORY_ORDER: ToolkitCategory[] = [
  'in-the-moment',
  'understand',
  'triggers',
  'planning-ahead',
  'stress',
  'sleep',
  'relationships',
  'identity',
  'after-a-slip',
  'motivation',
];

/** A skimmable, phone-first content block. */
export type ToolSection =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'steps'; items: string[] } // numbered
  | { type: 'list'; items: string[] } // bulleted
  | { type: 'lines'; items: string[] } // quotable one-liners
  | { type: 'callout'; text: string }; // gentle highlighted note

export type ToolkitTool = {
  id: string;
  category: ToolkitCategory;
  title: string;
  teaser: string;
  minutes: number;
  sections: ToolSection[];
  action?: { label: string; route: string };
};

export const TOOLKIT: ToolkitTool[] = [
  // ── In the moment ───────────────────────────────────────────────────────
  {
    id: 'urge-surfing',
    category: 'in-the-moment',
    title: 'Urge surfing',
    teaser: 'Ride the craving like a wave instead of fighting it.',
    minutes: 4,
    sections: [
      {
        type: 'paragraph',
        text: 'Fighting a craving head-on often makes it louder. Surfing it means letting it rise and fall while you stay steady — you’re the surfer, not the wave.',
      },
      { type: 'heading', text: 'Ride it out' },
      {
        type: 'steps',
        items: [
          'Notice it. Say to yourself, plainly: “This is a craving.”',
          'Find it in your body — chest, throat, hands, jaw. Just locate it.',
          'Breathe slow. In for four, out for six. Let the out-breath be longer.',
          'Watch it like weather. It’ll climb, peak, then start to drop.',
          'Stay with it, doing something small with your hands, until it eases.',
        ],
      },
      {
        type: 'callout',
        text: 'You don’t have to make it go away. You just have to outlast it — and you can.',
      },
    ],
    action: { label: 'Start the guided version', route: '/session/urge' },
  },
  {
    id: 'halt-check',
    category: 'in-the-moment',
    title: 'The HALT check',
    teaser: 'Hungry, Angry, Lonely, Tired? Meet the real need.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'Sometimes the pull to drink isn’t really about drinking. It’s another need wearing a disguise. Before you decide anything, run a quick check.',
      },
      { type: 'heading', text: 'Ask yourself: am I…' },
      {
        type: 'list',
        items: [
          'Hungry — when did I last actually eat?',
          'Angry — is something wound up in me that needs to come out?',
          'Lonely — do I need a person more than a drink?',
          'Tired — is the honest answer just: bed?',
        ],
      },
      {
        type: 'paragraph',
        text: 'If any of those is a yes, try meeting that need first — eat something, move, text someone, rest. The craving often shrinks once the real thing is handled.',
      },
    ],
  },

  // ── Understand ──────────────────────────────────────────────────────────
  {
    id: 'the-wave',
    category: 'understand',
    title: 'Cravings come in waves',
    teaser: 'They rise, they peak, and they pass — every time.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'A craving feels like it will keep climbing forever. It won’t. Cravings work like a wave: they build, they crest, and then they fall away on their own — usually within about 20 minutes, often much less.',
      },
      {
        type: 'callout',
        text: 'An urge is not a command. It’s a feeling passing through you, not an instruction you have to follow.',
      },
      { type: 'heading', text: 'What’s actually happening' },
      {
        type: 'list',
        items: [
          'Your brain learned that alcohol = quick relief, so it fires off a want.',
          'That want peaks and then loses energy, whether or not you drink.',
          'Every time you let a wave pass without drinking, the next one gets a little quieter.',
        ],
      },
    ],
    action: { label: 'Ride out an urge now', route: '/session/urge' },
  },

  // ── Triggers ────────────────────────────────────────────────────────────
  {
    id: 'spot-triggers',
    category: 'triggers',
    title: 'Spot your triggers',
    teaser: 'People, places, times, feelings — and one move for each.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'Cravings rarely come from nowhere. They’re usually set off by something — and once you can see the pattern, you can plan around it instead of being ambushed by it.',
      },
      { type: 'heading', text: 'The four usual suspects' },
      {
        type: 'list',
        items: [
          'People — certain mates, a partner, whoever you always drank with.',
          'Places — the pub, the sofa at 9pm, the kitchen after work.',
          'Times — Friday clock-off, Sunday dread, the moment you get in.',
          'Feelings — bored, stressed, celebrating, lonely, wired.',
        ],
      },
      { type: 'heading', text: 'Give each one a counter-move' },
      {
        type: 'lines',
        items: [
          'Home at 6pm → kettle on before I sit down.',
          'Stressed → ten minutes outside, phone in pocket.',
          'That one mate texts → suggest a walk, not a round.',
        ],
      },
    ],
  },

  // ── Planning ahead ──────────────────────────────────────────────────────
  {
    id: 'if-then',
    category: 'planning-ahead',
    title: 'If–then plans',
    teaser: 'Decide your move now, so you don’t have to later.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'Willpower in the moment is unreliable — everyone’s is. So make the decision in advance, when you’re calm, and hand your future self a ready-made move. “If X happens, then I’ll do Y.”',
      },
      { type: 'heading', text: 'Build a few of your own' },
      {
        type: 'lines',
        items: [
          'If I’m offered a drink at the party, then I’ll take a soft one and hold it.',
          'If Friday hits and I want to unwind, then I’ll order the 0.0 I actually like.',
          'If I’m still craving after 20 minutes, then I’ll message my person.',
        ],
      },
      {
        type: 'callout',
        text: 'The magic is that you’ve already chosen. In the moment there’s no decision to agonise over — just a plan to follow.',
      },
    ],
  },

  // ── Stress ──────────────────────────────────────────────────────────────
  {
    id: 'stress-says-drink',
    category: 'stress',
    title: 'When stress says drink',
    teaser: 'The day was a lot. Take the edge off another way.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'Alcohol is a fast off-switch for a stressed body — that’s why the pull is strongest on the hard days. The catch is it hands the stress back with interest a few hours later. You can get the relief without the rebound.',
      },
      { type: 'heading', text: 'Reset your body first' },
      {
        type: 'list',
        items: [
          'Longer out-breaths for two minutes — this alone calms the nervous system.',
          'Cold water on your face or wrists. Genuinely resets a wired state.',
          'Move for ten minutes — a walk, stairs, anything that shifts the energy.',
        ],
      },
      {
        type: 'callout',
        text: 'The stress feels like it needs a drink. It actually needs discharging — and your body already knows how.',
      },
    ],
  },
  {
    id: 'sober-rewards',
    category: 'stress',
    title: 'Unwind without a drink',
    teaser: 'Real ways to switch off and treat yourself.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'If drinking was your off-switch or your reward, you’ll need something to stand in its place — not forever, just for the evenings that used to belong to it. Line a few up before you need them.',
      },
      { type: 'heading', text: 'To switch off' },
      {
        type: 'list',
        items: [
          'A hot shower or bath, then the comfiest clothes you own.',
          'A show or game that asks nothing of you.',
          'A walk after dark — surprisingly good for a busy head.',
        ],
      },
      { type: 'heading', text: 'To reward yourself' },
      {
        type: 'list',
        items: [
          'Put the drink money somewhere you can see it add up.',
          'The nice coffee, the takeaway, the thing you’d normally skip.',
          'A lie-in with no hangover attached — the real prize.',
        ],
      },
    ],
    action: { label: 'Browse alcohol-free swaps', route: '/swaps' },
  },

  // ── Sleep ───────────────────────────────────────────────────────────────
  {
    id: 'sleep-without-nightcap',
    category: 'sleep',
    title: 'Sleep without the nightcap',
    teaser: 'A drink knocks you out — it doesn’t rest you.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'A nightcap feels like it helps you sleep, and for the first hour it does. Then alcohol blocks the deep, restoring stages and wakes you at 3am wired. The first few sober nights can be rough — that’s your sleep re-learning how to do it itself. It settles.',
      },
      { type: 'heading', text: 'Give sleep a fair shot' },
      {
        type: 'list',
        items: [
          'Same wake-up time every day, even after a bad night. Anchors everything.',
          'Wind down in dim light for the last hour — screens down, lamp not ceiling.',
          'A warm, non-alcoholic drink can hold the same ritual your body’s expecting.',
          'If you’re lying awake, get up, sit somewhere calm, come back when sleepy.',
        ],
      },
      {
        type: 'callout',
        text: 'Give it a couple of weeks. Waking up actually rested is one of the first gifts recovery hands back.',
      },
    ],
  },

  // ── Relationships ───────────────────────────────────────────────────────
  {
    id: 'saying-no',
    category: 'relationships',
    title: 'Saying no without the fuss',
    teaser: 'Easy lines to turn down a drink, and a clean exit.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'You don’t owe anyone an explanation or a debate. The best refusals are short, warm, and said like it’s no big deal — because it isn’t.',
      },
      { type: 'heading', text: 'Lines you can borrow' },
      {
        type: 'lines',
        items: [
          '“I’m good with this one, thanks.”',
          '“Not tonight — driving / early start / just not feeling it.”',
          '“I’m off it for a bit. Feeling loads better for it, honestly.”',
        ],
      },
      { type: 'heading', text: 'Give yourself an exit' },
      {
        type: 'paragraph',
        text: 'Decide before you go how and when you’ll leave, and have a reason ready. “I’m going to shoot off” is a full sentence. You’re allowed to protect your night.',
      },
    ],
  },
  {
    id: 'reaching-out',
    category: 'relationships',
    title: 'Line up your person',
    teaser: 'Sort your trusted contact before you need them.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'The hardest time to reach out is the moment you most need to. So do the setting-up now, while it’s easy — pick your person and tell them they’re your person.',
      },
      { type: 'heading', text: 'How to ask' },
      {
        type: 'paragraph',
        text: 'It can be as simple as: “I’m working on my drinking. Can I text you when it’s hard, even if I’ve got nothing clever to say?” Most people say yes, and are glad you asked.',
      },
      {
        type: 'callout',
        text: 'Reaching out isn’t weakness — it’s the single most protective thing you can do. Set it up before the wave, not during it.',
      },
    ],
    action: { label: 'Set up your Trusted Person', route: '/profile/trusted' },
  },

  // ── Identity ────────────────────────────────────────────────────────────
  {
    id: 'who-youre-becoming',
    category: 'identity',
    title: 'Who you’re becoming',
    teaser: 'Recovery isn’t a streak. It’s an identity, built one choice at a time.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'Streaks measure days. But a broken streak can make months of effort feel like nothing — and that’s a lie. What actually changes you isn’t an unbroken number; it’s the person you become through hundreds of small choices.',
      },
      { type: 'heading', text: 'From “I can’t drink” to “I don’t”' },
      {
        type: 'paragraph',
        text: 'There’s a quiet but huge difference. “I can’t drink” is a rule you’re fighting. “I don’t drink” is just who you are now — no fight, no debate. You’re not depriving yourself of something; you’re choosing something.',
      },
      {
        type: 'callout',
        text: 'Every time you ride one out, say no, or choose rest, you’re not just avoiding a drink — you’re casting a vote for the person you’re becoming.',
      },
      {
        type: 'list',
        items: [
          'Notice the choices, not just the abstinence.',
          'A slip is one vote, not the whole election.',
          'You don’t have to feel like a “new you”. You just have to keep choosing.',
        ],
      },
    ],
  },

  // ── After a slip ────────────────────────────────────────────────────────
  {
    id: 'after-a-slip',
    category: 'after-a-slip',
    title: 'After a slip',
    teaser: 'A lapse isn’t a relapse. Drop the shame, stay curious.',
    minutes: 2,
    sections: [
      {
        type: 'paragraph',
        text: 'You had a drink, or a few, when you didn’t mean to. First thing: this is not the end of anything, and it doesn’t erase what you’ve done. One night is a data point, not a verdict.',
      },
      {
        type: 'callout',
        text: 'The shame spiral is what turns one slip into a week. The slip itself is survivable. The “well, I’ve ruined it now” story is the real risk.',
      },
      { type: 'heading', text: 'Get curious, not cruel' },
      {
        type: 'steps',
        items: [
          'What was actually going on right before? Tired, upset, a certain place?',
          'What did you hope the drink would fix?',
          'What’s one thing you’d try instead next time that situation shows up?',
        ],
      },
      {
        type: 'paragraph',
        text: 'Then draw a line under it and carry on. Progress isn’t a clean streak — it’s the number of times you come back.',
      },
    ],
    action: { label: 'Talk it through', route: '/support/coach' },
  },

  // ── Motivation ──────────────────────────────────────────────────────────
  {
    id: 'decisional-balance',
    category: 'motivation',
    title: 'What it gives you, what it costs',
    teaser: 'Both are real. Look at them honestly, no lecture.',
    minutes: 3,
    sections: [
      {
        type: 'paragraph',
        text: 'Nobody drinks for no reason. Alcohol does something for you — that’s not a moral failing, it’s the whole point. Change gets easier when you’re honest about both sides instead of pretending the good side doesn’t exist.',
      },
      { type: 'heading', text: 'What drinking gives you' },
      {
        type: 'list',
        items: [
          'Takes the edge off fast.',
          'Feels like a reward, or a full stop on the day.',
          'Makes rooms and people easier.',
        ],
      },
      { type: 'heading', text: 'What it quietly costs' },
      {
        type: 'list',
        items: [
          'The 3am wake-up and the flat next day.',
          'Money, and time you don’t get back.',
          'The version of you your people miss.',
        ],
      },
      {
        type: 'callout',
        text: 'You’re not weak for wanting the good bits. Noticing the costs — without beating yourself up — is how the balance slowly tips.',
      },
    ],
  },
];

export function toolById(id: string): ToolkitTool | undefined {
  return TOOLKIT.find((t) => t.id === id);
}

export function toolsByCategory(cat: ToolkitCategory): ToolkitTool[] {
  return TOOLKIT.filter((t) => t.category === cat);
}
