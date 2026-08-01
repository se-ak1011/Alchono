import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { asPresence, type PresenceStatus } from '@/lib/presence';

/** My own chosen status + message, read straight off the profile in the store. */
export function useMyStatus(): { status: PresenceStatus; statusMessage: string | null } {
  const profile = useAuthStore((s) => s.profile) as any;
  return {
    status: asPresence(profile?.presence_status),
    statusMessage: (profile?.status_message ?? null) as string | null,
  };
}

/** Persist a new status (and optional status message) to my profile. */
export function useSetStatus() {
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  return useMutation({
    mutationFn: async ({
      status,
      statusMessage,
    }: {
      status: PresenceStatus;
      /** Pass undefined to leave the message unchanged; null/'' to clear it. */
      statusMessage?: string | null;
    }) => {
      const patch: Record<string, unknown> = { presence_status: status };
      if (statusMessage !== undefined) {
        const trimmed = statusMessage?.trim();
        patch.status_message = trimmed ? trimmed : null;
      }
      const { error } = await (supabase as any).from('profiles').update(patch).eq('id', userId!);
      if (error) throw error;
      return patch;
    },
    onSuccess: (patch) => {
      // Reflect instantly in my own UI…
      if (profile) setProfile({ ...(profile as any), ...patch });
      // …and let the room re-read my status on my own posts.
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}
