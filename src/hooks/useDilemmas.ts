import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type DilemmaKind = 'aita' | 'deep';

export interface Dilemma {
  id: string;
  kind: DilemmaKind;
  title: string;
  story: string; // original retelling / scenario — never copied
  created_at: string;
  // Deep ("would you?") dilemmas carry a binary choice and a reflective payoff.
  option_a: string | null;
  option_b: string | null;
  reflection: string | null;
}

/**
 * Published moral dilemmas for Food for Thought. `kind` picks the everyday
 * AITA set or the deep philosophical set. Original, curated (a human approved
 * each). Returns empty gracefully until the table/columns exist.
 */
export function useDilemmas(kind: DilemmaKind = 'aita') {
  return useQuery({
    queryKey: ['dilemmas', kind],
    queryFn: async (): Promise<Dilemma[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from('dilemmas')
          .select('id, kind, title, story, created_at, option_a, option_b, reflection')
          .eq('published', true)
          .eq('kind', kind)
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(40);
        if (error) return [];
        return (data ?? []) as Dilemma[];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}
