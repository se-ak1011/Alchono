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
