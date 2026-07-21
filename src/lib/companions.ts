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
  | 'tea'
  | 'armchair'
  | 'journal'
  | 'reading'
  | 'elbows'
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
      standing: require('../../assets/companions/image_01_standing.png'),
      tea: require('../../assets/companions/image_07_tea.png'),
      armchair: require('../../assets/companions/image_02_armchair.png'),
      journal: require('../../assets/companions/image_05_journal.png'),
      reading: require('../../assets/companions/image_06_reading.png'),
      elbows: require('../../assets/companions/image_14_elbows.png'),
      smile: require('../../assets/companions/image_19_small_smile.png'),
    },
  },
  {
    id: 'amara',
    name: 'Amara',
    blurb: 'Unhurried. Makes room for whatever you bring.',
    poses: {
      standing: require('../../assets/companions/amara_standing.png'),
    },
  },
  {
    id: 'marco',
    name: 'Marco',
    blurb: 'Straight with you, always gentle. Keeps you steady.',
    poses: {
      standing: require('../../assets/companions/marco_standing.png'),
    },
  },
  {
    id: 'yara',
    name: 'Yara',
    blurb: 'Gets it from the inside. Quietly in your corner.',
    poses: {
      standing: require('../../assets/companions/yara_standing.png'),
    },
  },
  {
    id: 'amos',
    name: 'Amos',
    blurb: 'Seen a lot of storms pass. Yours will too.',
    poses: {
      standing: require('../../assets/companions/amos_standing.png'),
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    blurb: 'Soft, and stronger than she looks. Right beside you.',
    poses: {
      standing: require('../../assets/companions/rose_standing.png'),
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
