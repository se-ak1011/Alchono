import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Dilemma {
  id: string;
  title: string;
  story: string; // original first-person retelling — never copied
  created_at: string;
}

/**
 * Published moral dilemmas for Food for Thought. Original, curated (a human
 * approved each). Returns empty gracefully until the table exists.
 */
export function useDilemmas() {
  return useQuery({
    queryKey: ['dilemmas'],
    queryFn: async (): Promise<Dilemma[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from('dilemmas')
          .select('id, title, story, created_at')
          .eq('published', true)
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
