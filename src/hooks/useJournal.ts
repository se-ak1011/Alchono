import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export function useJournalEntries(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ['journal', userId, days],
    queryFn: async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId!)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useSubmitJournal() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      triggers,
      affectedOthers,
      notes,
      drinkingSessionId,
    }: {
      triggers: string[];
      affectedOthers: string[];
      notes?: string;
      drinkingSessionId?: string;
    }) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId!,
          triggers,
          affected_others: affectedOthers,
          notes: notes ?? null,
          drinking_session_id: drinkingSessionId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', userId] });
      queryClient.invalidateQueries({ queryKey: ['insights', userId] });
      // So the home "How did it go?" card disappears the moment it's saved.
      queryClient.invalidateQueries({ queryKey: ['reflection-done'] });
    },
  });
}

/**
 * Whether a reflection has already been saved today. Reflection is a daily
 * practice — offered every morning regardless of whether yesterday involved a
 * drink — so "done" is tracked per day, not per drinking session.
 */
export function useReflectionDoneToday() {
  const userId = useAuthStore((s) => s.user?.id);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return useQuery({
    queryKey: ['reflection-done', userId, startOfToday.toDateString()],
    queryFn: async () => {
      const { count } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('created_at', startOfToday.toISOString());
      return (count ?? 0) > 0;
    },
    enabled: !!userId,
  });
}

export function useYesterdaySession() {
  const userId = useAuthStore((s) => s.user?.id);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
  const dayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

  return useQuery({
    queryKey: ['yesterday-session', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('drinking_sessions')
        .select('*')
        .eq('user_id', userId!)
        .gte('started_at', dayStart)
        .lte('started_at', dayEnd)
        .not('ended_at', 'is', null)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
}
