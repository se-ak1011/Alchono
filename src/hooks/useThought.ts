import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { Dilemma } from '@/hooks/useDilemmas';

// AITA dilemmas use these four fixed choices; deep dilemmas use a binary a/b
// taken from the dilemma's own option_a / option_b.
export type Choice = 'op_wrong' | 'they_wrong' | 'nobody' | 'everyone' | 'a' | 'b';

export const CHOICES: { key: Choice; label: string }[] = [
  { key: 'op_wrong', label: 'The teller was wrong' },
  { key: 'they_wrong', label: 'The other person was wrong' },
  { key: 'nobody', label: 'Nobody handled it well' },
  { key: 'everyone', label: 'Everyone was understandable' },
];

export function useDilemma(id?: string) {
  return useQuery({
    queryKey: ['dilemma', id],
    enabled: !!id,
    queryFn: async (): Promise<Dilemma | null> => {
      const { data } = await (supabase as any)
        .from('dilemmas')
        .select('id, kind, title, story, created_at, option_a, option_b, reflection')
        .eq('id', id!)
        .maybeSingle();
      return (data as Dilemma) ?? null;
    },
  });
}

/** The user's own vote on this dilemma, if any. */
export function useMyVote(dilemmaId?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['dilemma-vote', dilemmaId, userId],
    enabled: !!dilemmaId && !!userId,
    queryFn: async (): Promise<Choice | null> => {
      const { data } = await (supabase as any)
        .from('dilemma_votes')
        .select('choice')
        .eq('dilemma_id', dilemmaId!)
        .eq('user_id', userId!)
        .maybeSingle();
      return (data?.choice as Choice) ?? null;
    },
  });
}

export interface Results {
  total: number;
  pct: Partial<Record<Choice, number>>;
}

/** Anonymous community split — only meaningful once the user has voted.
 *  Tallies whatever choices came back, so it works for both the fixed AITA
 *  choices and the binary a/b of deep dilemmas. */
export function useDilemmaResults(dilemmaId?: string, enabled = false) {
  return useQuery({
    queryKey: ['dilemma-results', dilemmaId],
    enabled: !!dilemmaId && enabled,
    queryFn: async (): Promise<Results> => {
      const { data } = await (supabase as any).rpc('dilemma_results', {
        p_dilemma_id: dilemmaId!,
      });
      const rows = (data ?? []) as { choice: Choice; votes: number }[];
      const counts: Partial<Record<Choice, number>> = {};
      let total = 0;
      for (const r of rows) {
        const n = Number(r.votes) || 0;
        counts[r.choice] = n;
        total += n;
      }
      const pct: Partial<Record<Choice, number>> = {};
      (Object.keys(counts) as Choice[]).forEach((k) => {
        pct[k] = total > 0 ? Math.round(((counts[k] ?? 0) / total) * 100) : 0;
      });
      return { total, pct };
    },
  });
}

export function useVoteDilemma() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ dilemmaId, choice }: { dilemmaId: string; choice: Choice }) => {
      const { error } = await (supabase as any)
        .from('dilemma_votes')
        .insert({ dilemma_id: dilemmaId, user_id: userId, choice });
      if (error) throw error;
    },
    onSuccess: (_d, { dilemmaId, choice }) => {
      queryClient.setQueryData(['dilemma-vote', dilemmaId, userId], choice);
      queryClient.invalidateQueries({ queryKey: ['dilemma-results', dilemmaId] });
    },
  });
}
