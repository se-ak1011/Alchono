import { useAuthStore } from '@/store/authStore';
import {
  getCompanion,
  companionPose,
  type Companion,
  type CompanionPose,
} from '@/lib/companions';
import type { UserPreferences } from '@/types';

/**
 * The user's chosen companion and a helper to fetch any pose of it.
 *
 * Screens ask for a pose by name — `pose('tea')` — and get that pose for the
 * chosen mate, or its `standing` pose if that mate hasn't got the pose yet.
 */
export function useCompanion(): {
  companion: Companion;
  pose: (p: CompanionPose) => ReturnType<typeof companionPose>;
} {
  const profile = useAuthStore((s) => s.profile);
  const id = (profile?.preferences as UserPreferences | null)?.companionId ?? null;
  const companion = getCompanion(id);
  return {
    companion,
    pose: (p: CompanionPose) => companionPose(companion, p),
  };
}
