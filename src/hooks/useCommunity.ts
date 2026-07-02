import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';

const PAGE_SIZE = 20;

export function useCommunityFeed() {
  const userId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: ['community-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const [{ data, error }, { data: blocks }] = await Promise.all([
        supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1),
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId!),
      ]);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Hide posts from people the user has blocked.
      const blocked = new Set((blocks ?? []).map((b) => b.blocked_id));
      const visible = data.filter((p) => !blocked.has(p.user_id));

      // Usernames only matter for non-anonymous posts; profiles is
      // owner-only under RLS so they come from the public_profiles view.
      const names = await fetchUsernames(
        visible.filter((p) => !p.is_anonymous).map((p) => p.user_id),
      );
      return visible.map((p) => ({
        ...p,
        username: p.is_anonymous ? null : names[p.user_id] ?? 'Member',
      }));
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
