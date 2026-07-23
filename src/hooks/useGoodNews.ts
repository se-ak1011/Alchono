import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoodNewsItem {
  title: string;
  summary: string; // a complete little summary — never truncated in the UI
  source: string;
}

// Shown until the live feed loads (and if it ever can't be reached). Real,
// evergreen, verifiable — never invented. Mirrors the edge function's fallback.
const FALLBACK: GoodNewsItem[] = [
  { title: 'The ozone layer is healing', summary: 'After the world agreed to phase out CFCs, the ozone layer is on track to fully recover within decades — the hole over Antarctica is measurably shrinking.', source: 'UN Environment' },
  { title: 'Child mortality has more than halved', summary: 'Since 1990, the number of children who die before their fifth birthday has fallen by more than half worldwide — millions of lives saved every year through vaccines, clean water and better care.', source: 'UNICEF' },
  { title: 'Giving makes us happier than getting', summary: 'Studies find that spending money on other people lifts your own happiness more than spending it on yourself — generosity, it turns out, is a reliable route to feeling good.', source: 'Greater Good' },
  { title: 'The “helper’s high” is real', summary: 'A single act of kindness gives the brain a genuine chemical lift. Small, everyday kindness measurably lowers stress — for the giver as much as the receiver.', source: 'Greater Good' },
  { title: 'Guinea worm is nearly gone', summary: 'A disease that once caused millions of cases a year is down to just a handful — one of the great quiet public-health victories, achieved without a vaccine, through patience and community effort.', source: 'The Carter Center' },
];

/**
 * Food for the Soul — a small, slow window of good news. Pulls curated-positive
 * sources (human kindness + the science/psychology of wellbeing) via the
 * good-news edge function, cached for hours so it costs almost nothing. Never
 * empty — falls back to evergreen truths if the feed is unreachable.
 */
export function useGoodNews() {
  return useQuery({
    queryKey: ['good-news'],
    queryFn: async (): Promise<GoodNewsItem[]> => {
      try {
        const { data, error } = await supabase.functions.invoke('good-news', {
          body: {},
        });
        if (error) throw error;
        const raw = (data?.items ?? []) as Partial<GoodNewsItem>[];
        // Only trust items in the new shape (title + complete summary). If the
        // deployed function is still the old headline-only version, fall back
        // to evergreen summaries rather than render blanks.
        const valid = raw.filter(
          (it): it is GoodNewsItem => !!it && !!it.summary && !!it.title,
        );
        return valid.length ? valid : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h — good news can keep
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
