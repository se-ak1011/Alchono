import { useEffect } from 'react';
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

function updatePostInFeed(postId: string, update: (post: any) => any) {
  queryClient.setQueriesData({ queryKey: ['community-feed'] }, (old: any) => {
    if (!old?.pages) return old;
    return { ...old, pages: old.pages.map((page: any[]) => page.map((post) => post.id === postId ? update(post) : post)) };
  });
}

const PAGE_SIZE = 20;

export function useCommunityFeed(pageSize = PAGE_SIZE) {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useInfiniteQuery({
    queryKey: ['community-feed', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const pageOffset = pageParam * pageSize;
      const officialPosts = getOfficialTalkPosts();
      // Seed records decorate the first page; database pagination is completely
      // independent so local starter content can never hide real member posts.
      const officialPage = pageParam === 0 ? officialPosts : [];
      const databaseOffset = pageOffset;
      const databaseLimit = pageSize;
      // Nearby people first (server-side, coordinates never leave the DB);
      // falls back to plain recency if the function isn't deployed yet.
      const [nearby, { data: blocks }] = await Promise.all([
        supabase.rpc('community_feed_nearby', {
          p_limit: databaseLimit,
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
          .range(databaseOffset, databaseOffset + databaseLimit - 1);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      if (!data || data.length === 0) return officialPage;

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
      const databasePosts = visible.map((p) => ({
        ...p,
        username: p.is_anonymous ? null : names[p.user_id] ?? 'Member',
      }));
      return [...officialPage, ...databasePosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.filter((post) => !(post as any).is_seed_content).length === pageSize
        ? allPages.length
        : undefined,
    initialPageParam: 0,
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`community-talk-posts-${pageSize}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pageSize, userId]);
  return query;
}

export function usePostComments(postId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const databasePostId = postId && /^[0-9a-f-]{36}$/i.test(postId) ? postId : null;
  useEffect(() => {
    if (!userId || !databasePostId) return;
    const channel = supabase.channel(`community-comments-${databasePostId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_comments', filter: `post_id=eq.${databasePostId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['community-comments', databasePostId] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, databasePostId]);
  return useQuery({
    queryKey: ['community-comments', databasePostId],
    queryFn: async (): Promise<CommunityComment[]> => {
      if (!databasePostId) return [];
      const { data, error } = await (supabase as any).from('community_comments').select('*')
        .eq('post_id', databasePostId).order('created_at', { ascending: true });
      if (error) throw error;
      const names = await fetchUsernames((data ?? []).map((comment) => comment.user_id));
      return (data ?? []).map((comment) => ({
        ...comment, username: names[comment.user_id] ?? 'Member',
      }));
    },
    enabled: !!userId && !!databasePostId,
  });
}

export function useAddComment() {
  const userId = useAuthStore((s) => s.user?.id);
  const username = useAuthStore((s) => s.profile?.username) ?? 'Member';
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
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['community-comments', postId] });
      const previous = queryClient.getQueryData<CommunityComment[]>(['community-comments', postId]);
      queryClient.setQueryData<CommunityComment[]>(['community-comments', postId], (old = []) => [...old, {
        id: `pending-${Date.now()}`, post_id: postId, user_id: userId!, created_at: new Date().toISOString(), content: content.trim(), username,
      }]);
      updatePostInFeed(postId, (post) => ({ ...post, comment_count: (post.comment_count ?? 0) + 1 }));
      return { previous };
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(['community-comments', variables.postId], context?.previous ?? []);
      updatePostInFeed(variables.postId, (post) => ({ ...post, comment_count: Math.max((post.comment_count ?? 1) - 1, 0) }));
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-comments', variables.postId] });
    },
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
  const username = useAuthStore((s) => s.profile?.username);

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
    onMutate: async ({ content, isAnonymous = true }) => {
      await queryClient.cancelQueries({ queryKey: ['community-feed'] });
      const previous = queryClient.getQueriesData({ queryKey: ['community-feed'] });
      queryClient.setQueriesData({ queryKey: ['community-feed'] }, (old: any) => {
        if (!old?.pages?.[0]) return old;
        const pending = { id: `pending-${Date.now()}`, user_id: userId!, created_at: new Date().toISOString(), content, reactions: { heart: 0, clap: 0, handshake: 0 }, is_anonymous: isAnonymous, username: isAnonymous ? null : username ?? 'Member', moderation_status: 'published', removed_at: null, moderated_at: null, comment_count: 0, is_pending: true };
        return { ...old, pages: [[pending, ...old.pages[0]], ...old.pages.slice(1)] };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}

export function useReactToPost() {
  return useMutation({
    mutationFn: async ({
      postId,
      reaction,
    }: {
      postId: string;
      reaction: 'heart' | 'clap' | 'handshake';
      currentReactions: Record<string, number>;
    }) => {
      const { data, error } = await (supabase as any).rpc('react_to_community_post', { p_post_id: postId, p_reaction: reaction });
      if (error) throw error;
      return data as Record<string, number>;
    },
    onMutate: ({ postId, reaction, currentReactions }) => {
      updatePostInFeed(postId, (post) => ({ ...post, reactions: { ...currentReactions, [reaction]: (currentReactions[reaction] ?? 0) + 1 } }));
    },
    onSuccess: (reactions, variables) => {
      updatePostInFeed(variables.postId, (post) => ({ ...post, reactions }));
    },
    onError: (_error, variables) => {
      updatePostInFeed(variables.postId, (post) => ({ ...post, reactions: variables.currentReactions }));
    },
  });
}
