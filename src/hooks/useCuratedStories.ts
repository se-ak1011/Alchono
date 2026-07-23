import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CuratedStory {
  id: string;
  kind: 'giggle';
  title: string;
  body: string; // the full, original retelling — read entirely in-app
  category: string | null;
  created_at: string;
}

/**
 * Curated, approved stories for the Giggles feed. Reads only what's been
 * published (a human approved it) — never generated on the fly. Returns an
 * empty list gracefully if the table isn't there yet.
 */
export function useCuratedStories(kind: 'giggle') {
  return useQuery({
    queryKey: ['curated-stories', kind],
    queryFn: async (): Promise<CuratedStory[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from('curated_stories')
          .select('id, kind, title, body, category, created_at')
          .eq('kind', kind)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(60);
        if (error) return [];
        return (data ?? []) as CuratedStory[];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}
