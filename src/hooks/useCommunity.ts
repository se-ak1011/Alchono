import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 20;

export function useCommunityFeed() {
  const userId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: ['community-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      content,
      isAnonymous = true,
    }: {
      content: string;
      isAnonymous?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: userId!,
          content,
          is_anonymous: isAnonymous,
          reactions: { heart: 0, clap: 0, handshake: 0 },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}

export function useReactToPost() {
  return useMutation({
    mutationFn: async ({
      postId,
      reaction,
      currentReactions,
    }: {
      postId: string;
      reaction: 'heart' | 'clap' | 'handshake';
      currentReactions: Record<string, number>;
    }) => {
      const updated = {
        ...currentReactions,
        [reaction]: (currentReactions[reaction] ?? 0) + 1,
      };
      const { error } = await supabase
        .from('community_posts')
        .update({ reactions: updated })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}
