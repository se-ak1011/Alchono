import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type GoodFeedItem = {
  id: string;
  youtube_id: string;
  title: string;
  category: string;
  active: boolean;
  created_at: string;
};

export const DAILY_PICKS = 10;

/** Accepts full YouTube URLs (watch, shorts, youtu.be) or a bare 11-char id. */
export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (urlMatch) return urlMatch[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = ((seed >>> 0) || 1) & 0xffffffff;
  const rng = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Today's picks: a deliberately finite stack, shuffled per-day so everyone
 * gets a fresh set without infinite scroll.
 */
export function useGoodFeed() {
  return useQuery({
    queryKey: ['good-feed', new Date().toISOString().split('T')[0]],
    queryFn: async (): Promise<GoodFeedItem[]> => {
      const { data, error } = await supabase
        .from('good_feed')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      const daySeed = Math.floor(Date.now() / 86400000);
      return seededShuffle((data ?? []) as GoodFeedItem[], daySeed).slice(
        0,
        DAILY_PICKS,
      );
    },
    staleTime: 1000 * 60 * 60,
  });
}

/** Admin: the full catalogue, newest first. */
export function useAllGoodFeedItems() {
  return useQuery({
    queryKey: ['good-feed-all'],
    queryFn: async (): Promise<GoodFeedItem[]> => {
      const { data, error } = await supabase
        .from('good_feed')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoodFeedItem[];
    },
  });
}

export function useAddGoodFeedItem() {
  return useMutation({
    mutationFn: async ({
      url,
      title,
      category,
    }: {
      url: string;
      title: string;
      category: string;
    }) => {
      const youtubeId = parseYouTubeId(url);
      if (!youtubeId) throw new Error('That doesn’t look like a YouTube link.');
      const { error } = await supabase
        .from('good_feed')
        .insert({ youtube_id: youtubeId, title: title.trim(), category });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['good-feed-all'] });
      queryClient.invalidateQueries({ queryKey: ['good-feed'] });
    },
  });
}

export function useRemoveGoodFeedItem() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('good_feed').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['good-feed-all'] });
      queryClient.invalidateQueries({ queryKey: ['good-feed'] });
    },
  });
}
