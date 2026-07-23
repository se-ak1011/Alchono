import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoodNewsItem {
  headline: string;
  source: string;
}

// Shown until the live feed loads (and if it ever can't be reached). Real,
// evergreen, verifiable — never invented. Mirrors the edge function's fallback.
const FALLBACK: GoodNewsItem[] = [
  { headline: 'The ozone layer is on track to fully heal within decades — the hole is shrinking.', source: 'UN Environment' },
  { headline: 'Global child mortality has more than halved since 1990.', source: 'UNICEF' },
  { headline: 'Spending on other people boosts your own happiness more than spending on yourself.', source: 'Greater Good' },
  { headline: 'A single act of kindness gives the brain a genuine lift — the “helper’s high” is real.', source: 'Greater Good' },
  { headline: 'Guinea worm disease has gone from millions of cases a year to just a handful.', source: 'The Carter Center' },
];

/**
 * A small, slow window of good news for Home. Pulls curated-positive sources
 * (human kindness + the science/psychology of wellbeing) via the good-news
 * edge function, cached for hours so it costs almost nothing. Never empty —
 * falls back to evergreen truths if the feed is unreachable.
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
        const items = (data?.items ?? []) as GoodNewsItem[];
        return items.length ? items : FALLBACK;
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h — good news can keep
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
