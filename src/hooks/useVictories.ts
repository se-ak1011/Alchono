import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useLogUrgeOutcome() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      outcome,
      durationSeconds,
    }: {
      outcome: 'passed' | 'drank';
      durationSeconds?: number;
    }) => {
      const { error } = await supabase.from('urge_events').insert({
        user_id: userId!,
        outcome,
        ...(durationSeconds ? { duration_seconds: Math.round(durationSeconds) } : {}),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urge-stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['urge-duration', userId] });
    },
  });
}

/**
 * The user's own typical urge length — "your urges usually pass in ~18
 * minutes". Needs at least 2 timed passes to say anything.
 */
export function useTypicalUrgeMinutes() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['urge-duration', userId],
    queryFn: async (): Promise<number | null> => {
      const { data } = await supabase
        .from('urge_events')
        .select('duration_seconds')
        .eq('user_id', userId!)
        .eq('outcome', 'passed')
        .not('duration_seconds', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      const durations = (data ?? [])
        .map((r: any) => r.duration_seconds as number)
        .filter((d) => d > 0);
      if (durations.length < 2) return null;
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      return Math.max(1, Math.round(avg / 60));
    },
    enabled: !!userId,
  });
}

/** Urges beaten: within the period and all-time. */
export function useUrgeStats(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['urge-stats', userId, days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [{ count: periodPassed }, { count: allTimePassed }] = await Promise.all([
        supabase
          .from('urge_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .eq('outcome', 'passed')
          .gte('created_at', since),
        supabase
          .from('urge_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .eq('outcome', 'passed'),
      ]);
      return {
        periodPassed: periodPassed ?? 0,
        allTimePassed: allTimePassed ?? 0,
      };
    },
    enabled: !!userId,
  });
}

/** Is today marked alcohol-free? */
export function useAfToday() {
  const userId = useAuthStore((s) => s.user?.id);
  const today = todayStr();

  return useQuery({
    queryKey: ['af-today', userId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('alcohol_free_days')
        .select('id')
        .eq('user_id', userId!)
        .eq('date', today)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId,
  });
}

export function useToggleAlcoholFree() {
  const userId = useAuthStore((s) => s.user?.id);
  const today = todayStr();

  return useMutation({
    mutationFn: async (mark: boolean) => {
      if (mark) {
        const { error } = await supabase
          .from('alcohol_free_days')
          .upsert(
            { user_id: userId!, date: today },
            { onConflict: 'user_id,date' },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('alcohol_free_days')
          .delete()
          .eq('user_id', userId!)
          .eq('date', today);
        if (error) throw error;
      }
    },
    onMutate: (mark) => {
      // Optimistic — the toggle must feel instant.
      queryClient.setQueryData(['af-today', userId, today], mark);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['af-today', userId] });
      queryClient.invalidateQueries({ queryKey: ['af-count', userId] });
      queryClient.invalidateQueries({ queryKey: ['af-month', userId] });
    },
  });
}

/** Alcohol-free days marked within the last N days (insights). */
export function useAfDaysCount(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['af-count', userId, days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000)
        .toISOString()
        .split('T')[0];
      const { count } = await supabase
        .from('alcohol_free_days')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('date', since);
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

/**
 * Every alcohol-free day the user has ever marked, oldest first. One row per
 * date — the raw material for the Recovery Constellation, where each becomes a
 * permanent star.
 */
export function useAfDays() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['af-days-all', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('alcohol_free_days')
        .select('date')
        .eq('user_id', userId!)
        .order('date', { ascending: true });
      return ((data ?? []) as { date: string }[]).map((r) => r.date);
    },
    enabled: !!userId,
  });
}

/** Alcohol-free days marked in the current calendar month (home card). */
export function useAfMonthCount() {
  const userId = useAuthStore((s) => s.user?.id);
  const monthStart = `${todayStr().slice(0, 7)}-01`;

  return useQuery({
    queryKey: ['af-month', userId, monthStart],
    queryFn: async () => {
      const { count } = await supabase
        .from('alcohol_free_days')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('date', monthStart);
      return count ?? 0;
    },
    enabled: !!userId,
  });
}
