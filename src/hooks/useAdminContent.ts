import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useIsAdmin } from '@/hooks/useAdmin';

export interface PendingStory {
  id: string;
  title: string;
  body: string;
  category: string | null;
  created_at: string;
}
export interface PendingDilemma {
  id: string;
  title: string;
  story: string;
  created_at: string;
}

export type ContentTable = 'curated_stories' | 'dilemmas';

/** Everything awaiting approval — admins only. */
export function useAdminPending() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin-pending-content'],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [stories, dilemmas] = await Promise.all([
        (supabase as any)
          .from('curated_stories')
          .select('id, title, body, category, created_at')
          .eq('published', false)
          .order('created_at', { ascending: true }),
        (supabase as any)
          .from('dilemmas')
          .select('id, title, story, created_at')
          .eq('published', false)
          .order('created_at', { ascending: true }),
      ]);
      return {
        stories: (stories.data ?? []) as PendingStory[],
        dilemmas: (dilemmas.data ?? []) as PendingDilemma[],
      };
    },
  });
}

/** Approve (publish) a pending item. */
export function usePublishContent() {
  return useMutation({
    mutationFn: async ({ table, id }: { table: ContentTable; id: string }) => {
      const { error } = await (supabase as any)
        .from(table)
        .update({ published: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-content'] });
      queryClient.invalidateQueries({ queryKey: ['curated-stories'] });
      queryClient.invalidateQueries({ queryKey: ['dilemmas'] });
    },
  });
}

/** Bin a pending item for good. */
export function useRemoveContent() {
  return useMutation({
    mutationFn: async ({ table, id }: { table: ContentTable; id: string }) => {
      const { error } = await (supabase as any).from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-content'] });
    },
  });
}
