import type { ImageSourcePropType } from 'react-native';

/**
 * The companion characters ("mates") a user can choose to walk with them.
 *
 * A companion is a kindred presence, never a likeness of the user — the point
 * is a mate on the journey, not a mirror. Each mate declares whatever poses it
 * has; any pose it lacks falls back to `standing`, so a brand-new mate can ship
 * with a single drawing and still appear correctly in every screen. Add more
 * poses (or more mates) any time — nothing else needs to change.
 */

export type CompanionPose =
  | 'standing'
  | 'bust'   // zoomed head-and-torso "first shot" for in-app presence
  | 'tea'      // seated with a warm drink — Support
  | 'armchair' // settled in an armchair — AI Coach
  | 'journal'  // writing — Writing Room
  | 'reading'  // reading — Reading Corner
  | 'elbows'   // leaning in, elbows on knees — urge flow
  | 'playing'  // playful, at ease — Games Arcade
  | 'token'    // holding a token, looking up — constellation sky
  | 'barista'  // apron on, pouring a drink — The Bar
  | 'call'     // seated, phone to ear — Resources (call)
  | 'text'     // seated, texting — Resources (text)
  | 'door'     // knocking at a door — Resources (meetings)
  | 'smile';

export interface Companion {
  id: string;
  name: string;
  /** One short line of vibe, shown in the picker. */
  blurb: string;
  /** `standing` is required; every other pose is optional (falls back to it). */
  poses: { standing: ImageSourcePropType } & Partial<
    Record<CompanionPose, ImageSourcePropType>
  >;
}

export const COMPANIONS: Companion[] = [
  {
    id: 'kai',
    name: 'Kai',
    blurb: 'Quiet and steady. Been there. Not going anywhere.',
    poses: {
      standing: require('../../assets/companions/kai_standing.png'),
      bust: require('../../assets/companions/kai_bust.png'),
      armchair: require('../../assets/companions/kai_armchair.png'),
      tea: require('../../assets/companions/kai_tea.png'),
      reading: require('../../assets/companions/kai_reading.png'),
      journal: require('../../assets/companions/kai_journal.png'),
      elbows: require('../../assets/companions/kai_elbows.png'),
      playing: require('../../assets/companions/kai_playing.png'),
      token: require('../../assets/companions/kai_token.png'),
      barista: require('../../assets/companions/kai_barista.png'),
      call: require('../../assets/companions/kai_call.png'),
      text: require('../../assets/companions/kai_text.png'),
      door: require('../../assets/companions/kai_door.png'),
    },
  },
  {
    id: 'amara',
    name: 'Amara',
    blurb: 'Unhurried. Makes room for whatever you bring.',
    poses: {
      standing: require('../../assets/companions/amara_standing.png'),
      bust: require('../../assets/companions/amara_bust.png'),
      armchair: require('../../assets/companions/amara_armchair.png'),
      tea: require('../../assets/companions/amara_tea.png'),
      reading: require('../../assets/companions/amara_reading.png'),
      journal: require('../../assets/companions/amara_journal.png'),
      elbows: require('../../assets/companions/amara_elbows.png'),
      playing: require('../../assets/companions/amara_playing.png'),
      token: require('../../assets/companions/amara_token.png'),
      call: require('../../assets/companions/amara_call.png'),
      text: require('../../assets/companions/amara_text.png'),
      door: require('../../assets/companions/amara_door.png'),
    },
  },
  {
    id: 'marco',
    name: 'Marco',
    blurb: 'Straight with you, always gentle. Keeps you steady.',
    poses: {
      standing: require('../../assets/companions/marco_standing.png'),
      bust: require('../../assets/companions/marco_bust.png'),
      armchair: require('../../assets/companions/marco_armchair.png'),
      tea: require('../../assets/companions/marco_tea.png'),
      reading: require('../../assets/companions/marco_reading.png'),
      journal: require('../../assets/companions/marco_journal.png'),
      elbows: require('../../assets/companions/marco_elbows.png'),
      playing: require('../../assets/companions/marco_playing.png'),
      token: require('../../assets/companions/marco_token.png'),
      call: require('../../assets/companions/marco_call.png'),
      text: require('../../assets/companions/marco_text.png'),
      door: require('../../assets/companions/marco_door.png'),
    },
  },
  {
    id: 'yara',
    name: 'Yara',
    blurb: 'Gets it from the inside. Quietly in your corner.',
    poses: {
      standing: require('../../assets/companions/yara_standing.png'),
      bust: require('../../assets/companions/yara_bust.png'),
      armchair: require('../../assets/companions/yara_armchair.png'),
      tea: require('../../assets/companions/yara_tea.png'),
      reading: require('../../assets/companions/yara_reading.png'),
      journal: require('../../assets/companions/yara_journal.png'),
      elbows: require('../../assets/companions/yara_elbows.png'),
      playing: require('../../assets/companions/yara_playing.png'),
      token: require('../../assets/companions/yara_token.png'),
      call: require('../../assets/companions/yara_call.png'),
      text: require('../../assets/companions/yara_text.png'),
      door: require('../../assets/companions/yara_door.png'),
    },
  },
  {
    id: 'amos',
    name: 'Amos',
    blurb: 'Seen a lot of storms pass. Yours will too.',
    poses: {
      standing: require('../../assets/companions/amos_standing.png'),
      bust: require('../../assets/companions/amos_bust.png'),
      armchair: require('../../assets/companions/amos_armchair.png'),
      tea: require('../../assets/companions/amos_tea.png'),
      reading: require('../../assets/companions/amos_reading.png'),
      journal: require('../../assets/companions/amos_journal.png'),
      elbows: require('../../assets/companions/amos_elbows.png'),
      playing: require('../../assets/companions/amos_playing.png'),
      token: require('../../assets/companions/amos_token.png'),
      call: require('../../assets/companions/amos_call.png'),
      text: require('../../assets/companions/amos_text.png'),
      door: require('../../assets/companions/amos_door.png'),
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    blurb: 'Soft, and stronger than she looks. Right beside you.',
    poses: {
      standing: require('../../assets/companions/rose_standing.png'),
      bust: require('../../assets/companions/rose_bust.png'),
      armchair: require('../../assets/companions/rose_armchair.png'),
      tea: require('../../assets/companions/rose_tea.png'),
      reading: require('../../assets/companions/rose_reading.png'),
      journal: require('../../assets/companions/rose_journal.png'),
      elbows: require('../../assets/companions/rose_elbows.png'),
      playing: require('../../assets/companions/rose_playing.png'),
      token: require('../../assets/companions/rose_token.png'),
      call: require('../../assets/companions/rose_call.png'),
      text: require('../../assets/companions/rose_text.png'),
      door: require('../../assets/companions/rose_door.png'),
    },
  },
  // New mates slot in here — a single `standing` pose is enough to start.
];

export const DEFAULT_COMPANION_ID = 'kai';

/** Resolve a stored id to a companion, always returning a valid one. */
export function getCompanion(id: string | null | undefined): Companion {
  return (
    COMPANIONS.find((c) => c.id === id) ??
    COMPANIONS.find((c) => c.id === DEFAULT_COMPANION_ID) ??
    COMPANIONS[0]
  );
}

/** The image for a pose, falling back to the mate's `standing` pose. */
export function companionPose(
  companion: Companion,
  pose: CompanionPose,
): ImageSourcePropType {
  return companion.poses[pose] ?? companion.poses.standing;
}
