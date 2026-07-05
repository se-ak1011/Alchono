import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

/** Save tonight's choices — replaces any already recorded today. */
export function useSaveChoices() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (choices: string[]) => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      // Re-saving replaces today's set rather than duplicating it.
      await supabase
        .from('daily_choices')
        .delete()
        .eq('user_id', userId!)
        .gte('created_at', startOfToday.toISOString());
      const rows = choices
        .map((c) => c.trim())
        .filter(Boolean)
        .map((choice) => ({ user_id: userId!, choice }));
      if (rows.length) {
        const { error } = await supabase.from('daily_choices').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choices-done'] });
      queryClient.invalidateQueries({ queryKey: ['choice-stats'] });
    },
  });
}

export type ChoiceStats = {
  total: number;
  breakdown: { label: string; count: number }[];
};

/** All-time (and windowed) tally of choices, for Insights. */
export function useChoiceStats(days?: number) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['choice-stats', userId, days ?? 'all'],
    queryFn: async (): Promise<ChoiceStats> => {
      let q = supabase.from('daily_choices').select('choice').eq('user_id', userId!);
      if (days) {
        const since = new Date(Date.now() - days * 86400_000).toISOString();
        q = q.gte('created_at', since);
      }
      const { data } = await q;
      const rows = (data ?? []) as { choice: string }[];
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.choice] = (counts[r.choice] ?? 0) + 1;
      const breakdown = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({ label, count }));
      return { total: rows.length, breakdown };
    },
    enabled: !!userId,
  });
}
