import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';

export type TrustedLink = {
  id: string;
  user_id: string;
  trusted_user_id: string;
  status: string;
  created_at: string;
  otherUsername: string;
};

export type TrustedSignals = {
  checked_in_today: boolean;
  urge_beaten_today: boolean;
  rough_day: boolean;
  asked_for_support: boolean;
};

/** People I've nominated to look out for me. */
export function useMyTrustedPeople() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['trusted-mine', userId],
    queryFn: async (): Promise<TrustedLink[]> => {
      const { data, error } = await supabase
        .from('trusted_links')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      if (!data?.length) return [];
      const names = await fetchUsernames(data.map((l) => l.trusted_user_id));
      return data.map((l) => ({
        ...l,
        otherUsername: names[l.trusted_user_id] ?? 'Member',
      }));
    },
    enabled: !!userId,
  });
}

/** People who nominated ME (pending invites + accepted). */
export function usePeopleITrustFor() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['trusted-for', userId],
    queryFn: async (): Promise<TrustedLink[]> => {
      const { data, error } = await supabase
        .from('trusted_links')
        .select('*')
        .eq('trusted_user_id', userId!)
        .neq('status', 'declined');
      if (error) throw error;
      if (!data?.length) return [];
      const names = await fetchUsernames(data.map((l) => l.user_id));
      return data.map((l) => ({
        ...l,
        otherUsername: names[l.user_id] ?? 'Member',
      }));
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useInviteTrusted() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (username: string) => {
      const name = username.trim();
      // Exact-match lookup only — no browsing, no fuzzy search.
      const { data: person } = await supabase
        .from('public_profiles')
        .select('id, username')
        .eq('username', name)
        .maybeSingle();
      if (!person?.id) throw new Error(`No one goes by "${name}". Check the exact spelling.`);
      if (person.id === userId) throw new Error("That's you.");
      const { error } = await supabase
        .from('trusted_links')
        .insert({ user_id: userId!, trusted_user_id: person.id });
      if (error) {
        if (error.code === '23505') throw new Error('You already invited them.');
        throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['trusted-mine', userId] }),
  });
}

export function useRespondTrusted() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ linkId, accept }: { linkId: string; accept: boolean }) => {
      const { error } = await supabase
        .from('trusted_links')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['trusted-for', userId] }),
  });
}

export function useRemoveTrusted() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('trusted_links').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-mine', userId] });
      queryClient.invalidateQueries({ queryKey: ['trusted-for', userId] });
    },
  });
}

/** Today's four wellbeing booleans for someone who trusts me. */
export function useTrustedSignals(linkId: string) {
  return useQuery({
    queryKey: ['trusted-signals', linkId],
    queryFn: async (): Promise<TrustedSignals | null> => {
      const { data, error } = await supabase.rpc('get_trusted_signals', {
        p_link_id: linkId,
      } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as TrustedSignals) ?? null;
    },
    refetchInterval: 60_000,
  });
}

/** Fire-and-forget: log that the user reached for support (SOS). */
export function logSupportTap(userId: string | undefined) {
  if (!userId) return;
  supabase
    .from('support_taps')
    .insert({ user_id: userId })
    .then(() => {});
}
