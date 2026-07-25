import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';
import { getOfficialTalkPosts } from '@/data/officialSeed';

export type CommunityComment = {
  id: string; post_id: string; user_id: string; created_at: string; content: string;
  username: string;
};

const PAGE_SIZE = 20;

export function useCommunityFeed(pageSize = PAGE_SIZE) {
  const userId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: ['community-feed', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const pageOffset = pageParam * pageSize;
      const officialPosts = getOfficialTalkPosts();
      if (pageOffset < officialPosts.length) {
        return officialPosts.slice(pageOffset, pageOffset + pageSize);
      }
      const databaseOffset = pageOffset - officialPosts.length;
      // Nearby people first (server-side, coordinates never leave the DB);
      // falls back to plain recency if the function isn't deployed yet.
      const [nearby, { data: blocks }] = await Promise.all([
        supabase.rpc('community_feed_nearby', {
          p_limit: pageSize,
          p_offset: databaseOffset,
        }),
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId!),
      ]);

      let data = nearby.data;
      let error = nearby.error;
      if (error) {
        const fallback = await supabase
          .from('community_posts')
          .select('*')
          .is('removed_at', null)
          .eq('moderation_status', 'published')
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .range(databaseOffset, databaseOffset + pageSize - 1);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Hide posts from people the user has blocked.
      const blocked = new Set((blocks ?? []).map((b) => b.blocked_id));
      const now = Date.now();
      const visible = data.filter(
        (p) => !blocked.has(p.user_id) && new Date(p.created_at).getTime() <= now,
      );

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
      lastPage.length === pageSize ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!userId,
  });
}

export function usePostComments(postIds: string[]) {
  const userId = useAuthStore((s) => s.user?.id);
  const databasePostIds = postIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  return useQuery({
    queryKey: ['community-comments', databasePostIds],
    queryFn: async (): Promise<CommunityComment[]> => {
      if (!databasePostIds.length) return [];
      const { data, error } = await (supabase as any).from('community_comments').select('*')
        .in('post_id', databasePostIds).order('created_at', { ascending: true });
      if (error) throw error;
      const names = await fetchUsernames((data ?? []).map((comment) => comment.user_id));
      return (data ?? []).map((comment) => ({
        ...comment, username: names[comment.user_id] ?? 'Member',
      }));
    },
    enabled: !!userId && databasePostIds.length > 0,
  });
}

export function useAddComment() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const clean = content.trim();
      if (!clean) throw new Error('Comment cannot be empty.');
      const { data, error } = await (supabase as any).from('community_comments').insert({
        post_id: postId, user_id: userId!, content: clean,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-comments'] }),
  });
}

export const TALK_REPORT_REASONS = [
  'Spam', 'Harassment', 'Hate speech', 'Self-harm concern', 'Misinformation', 'Other',
] as const;

export function useReportPost() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: typeof TALK_REPORT_REASONS[number] }) => {
      const { error } = await (supabase as any).from('community_post_reports').insert({
        post_id: postId, reporter_id: userId!, reason,
      });
      if (error) {
        if (error.code === '23505') throw new Error('You have already reported this post.');
        throw error;
      }
    },
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
          moderation_status: 'published',
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
