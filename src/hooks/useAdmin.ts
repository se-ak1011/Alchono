import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';
import type { Report } from '@/types';

/**
 * Admin status comes from the admins table, which has no client write
 * policies — it can only be granted from the Supabase dashboard.
 */
export function useIsAdmin() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['is-admin', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', userId!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30,
  });
}

export type AdminReport = Report & {
  reporterUsername: string;
  reportedUsername: string;
};

export function useAdminReports() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async (): Promise<AdminReport[]> => {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!reports || reports.length === 0) return [];

      const names = await fetchUsernames([
        ...reports.map((r) => r.reporter_id),
        ...reports.map((r) => r.reported_user_id),
      ]);

      return reports.map((r) => ({
        ...r,
        reporterUsername: names[r.reporter_id] ?? 'Unknown',
        reportedUsername: names[r.reported_user_id] ?? 'Unknown',
      }));
    },
    enabled: !!isAdmin,
  });
}

export function useUpdateReportStatus() {
  return useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: 'open' | 'resolved' | 'dismissed';
    }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}

export type ModeratedTalkPost = {
  id: string; content: string; created_at: string; moderation_status: string;
  author: string; reports: Array<{ id: string; reason: string; status: string }>;
};

export function useModeratedTalkPosts() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin-talk-moderation'],
    queryFn: async (): Promise<ModeratedTalkPost[]> => {
      const { data: reports, error } = await (supabase as any).from('community_post_reports').select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const postIds = [...new Set((reports ?? []).map((report) => report.post_id))];
      if (!postIds.length) return [];
      const { data: posts, error: postsError } = await supabase.from('community_posts').select('*').in('id', postIds);
      if (postsError) throw postsError;
      const names = await fetchUsernames((posts ?? []).map((post) => post.user_id));
      return (posts ?? []).map((post) => ({
        id: post.id, content: post.content, created_at: post.created_at,
        moderation_status: post.moderation_status,
        author: post.is_anonymous ? 'Anonymous' : names[post.user_id] ?? 'Member',
        reports: (reports ?? []).filter((report) => report.post_id === post.id),
      }));
    },
    enabled: !!isAdmin,
  });
}

export function useModerateTalkPost() {
  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'ignore' | 'remove' }) => {
      const status = action === 'remove' ? 'removed' : 'ignored';
      const { error: reportError } = await (supabase as any).from('community_post_reports').update({ status }).eq('post_id', postId).eq('status', 'open');
      if (reportError) throw reportError;
      if (action === 'remove') {
        const { error } = await supabase.from('community_posts').update({
          moderation_status: 'removed', removed_at: new Date().toISOString(), moderated_at: new Date().toISOString(),
        }).eq('id', postId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-talk-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}
