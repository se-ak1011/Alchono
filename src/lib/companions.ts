import type { ImageSourcePropType } from 'react-native';

/**
 * Companions (retired). The app used to show a chosen "mate" character as a
 * decorative overlay on many screens; the adventure-hub redesign replaced that
 * presence with the rooms themselves, so the character art has been removed.
 *
 * This module is kept as a thin, image-free stub so the few remaining callers
 * (a stored `companionId`, the pose() helper) keep compiling. Every pose now
 * resolves to `undefined`, and `CompanionArt` renders nothing for that, so no
 * companion appears anywhere. Safe to delete entirely once those callers go.
 */

export type CompanionPose =
  | 'standing'
  | 'bust'
  | 'tea'
  | 'armchair'
  | 'journal'
  | 'reading'
  | 'elbows'
  | 'playing'
  | 'token'
  | 'barista'
  | 'call'
  | 'text'
  | 'door'
  | 'smile';

export interface Companion {
  id: string;
  name: string;
  blurb: string;
  /** No art any more — every pose is absent and resolves to nothing. */
  poses: Partial<Record<CompanionPose, ImageSourcePropType>>;
}

export const COMPANIONS: Companion[] = [
  { id: 'kai', name: 'Kai', blurb: '', poses: {} },
  { id: 'amara', name: 'Amara', blurb: '', poses: {} },
  { id: 'marco', name: 'Marco', blurb: '', poses: {} },
  { id: 'yara', name: 'Yara', blurb: '', poses: {} },
  { id: 'amos', name: 'Amos', blurb: '', poses: {} },
  { id: 'rose', name: 'Rose', blurb: '', poses: {} },
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

/** Retired: there is no companion art, so every pose resolves to nothing. */
export function companionPose(
  _companion: Companion,
  _pose: CompanionPose,
): ImageSourcePropType | undefined {
  return undefined;
}
