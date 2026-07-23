import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { Dilemma } from '@/hooks/useDilemmas';

export type Choice = 'op_wrong' | 'they_wrong' | 'nobody' | 'everyone';

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
        .select('id, title, story, created_at')
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
  pct: Record<Choice, number>;
}

/** Anonymous community split — only meaningful once the user has voted. */
export function useDilemmaResults(dilemmaId?: string, enabled = false) {
  return useQuery({
    queryKey: ['dilemma-results', dilemmaId],
    enabled: !!dilemmaId && enabled,
    queryFn: async (): Promise<Results> => {
      const { data } = await (supabase as any).rpc('dilemma_results', {
        p_dilemma_id: dilemmaId!,
      });
      const rows = (data ?? []) as { choice: Choice; votes: number }[];
      const counts: Record<Choice, number> = {
        op_wrong: 0,
        they_wrong: 0,
        nobody: 0,
        everyone: 0,
      };
      let total = 0;
      for (const r of rows) {
        counts[r.choice] = Number(r.votes) || 0;
        total += Number(r.votes) || 0;
      }
      const pct: Record<Choice, number> = { op_wrong: 0, they_wrong: 0, nobody: 0, everyone: 0 };
      (Object.keys(counts) as Choice[]).forEach((k) => {
        pct[k] = total > 0 ? Math.round((counts[k] / total) * 100) : 0;
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
