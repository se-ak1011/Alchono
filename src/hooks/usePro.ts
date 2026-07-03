import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';

export type ClientLink = {
  id: string;
  professional_id: string;
  member_id: string;
  status: string;
  created_at: string;
  otherUsername: string;
};

export type ClientTrends = {
  checked_in_today: boolean;
  last_active: string | null;
  af_days_30: number;
  urges_beaten_30: number;
  urges_faced_30: number;
  sessions_30: number;
  journal_notes_30: number;
  top_mood: string | null;
};

/** My professional record (org, verified). Null if not a professional. */
export function useProfessional() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['professional', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('professionals' as any)
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      return data as { user_id: string; org: string | null; verified: boolean } | null;
    },
    enabled: !!userId,
  });
}

/** Professional side: my clients (accepted) and pending asks. */
export function useMyClients() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['pro-clients', userId],
    queryFn: async (): Promise<ClientLink[]> => {
      const { data, error } = await supabase
        .from('client_links' as any)
        .select('*')
        .eq('professional_id', userId!)
        .in('status', ['pending', 'accepted']);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      if (!rows.length) return [];
      const names = await fetchUsernames(rows.map((l) => l.member_id));
      return rows.map((l) => ({
        ...l,
        otherUsername: names[l.member_id] ?? 'Member',
      }));
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

/** Request access to a member by EXACT username (given to you by them). */
export function useRequestClient() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (username: string) => {
      const name = username.trim();
      const { data: person } = await supabase
        .from('public_profiles')
        .select('id, username')
        .eq('username', name)
        .maybeSingle();
      if (!person?.id)
        throw new Error(`No member goes by "${name}". Ask them for their exact username or QR code.`);
      const { error } = await supabase
        .from('client_links' as any)
        .insert({ professional_id: userId!, member_id: person.id });
      if (error) {
        if (error.code === '23505') throw new Error('You already have a link with this member.');
        if (error.code === '42501')
          throw new Error('Your account is awaiting verification — you cannot add clients yet.');
        throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['pro-clients', userId] }),
  });
}

export function useClientTrends(linkId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['client-trends', linkId],
    queryFn: async (): Promise<ClientTrends | null> => {
      const { data, error } = await supabase.rpc('get_client_trends' as any, {
        p_link_id: linkId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as ClientTrends) ?? null;
    },
    enabled,
    refetchInterval: 5 * 60_000,
  });
}

/** Member side: professionals asking for / holding access to my trends. */
export function useMyCareTeam() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['care-team', userId],
    queryFn: async (): Promise<ClientLink[]> => {
      const { data, error } = await supabase
        .from('client_links' as any)
        .select('*')
        .eq('member_id', userId!)
        .in('status', ['pending', 'accepted']);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      if (!rows.length) return [];
      const names = await fetchUsernames(rows.map((l) => l.professional_id));
      return rows.map((l) => ({
        ...l,
        otherUsername: names[l.professional_id] ?? 'Counsellor',
      }));
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useRespondToCareRequest() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({
      linkId,
      status,
    }: {
      linkId: string;
      status: 'accepted' | 'declined' | 'revoked';
    }) => {
      const { error } = await supabase
        .from('client_links' as any)
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['care-team', userId] }),
  });
}

/** Admin: professionals awaiting verification. */
export function useUnverifiedProfessionals() {
  return useQuery({
    queryKey: ['admin-professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      if (!rows.length) return [];
      const names = await fetchUsernames(rows.map((p) => p.user_id));
      return rows.map((p) => ({ ...p, username: names[p.user_id] ?? 'Unknown' }));
    },
  });
}

export function useVerifyProfessional() {
  return useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('professionals' as any)
        .update({ verified })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-professionals'] }),
  });
}
