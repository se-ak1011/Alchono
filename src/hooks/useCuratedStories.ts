import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getOfficialGiggles } from '@/data/officialSeed';

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
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(60);
        if (error) return [];
        const live = (data ?? []) as CuratedStory[];
        return [...getOfficialGiggles(), ...live].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } catch {
        return getOfficialGiggles();
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}
