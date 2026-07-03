import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export type TimelineEntry = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  derived: boolean;
};

const URGE_MARKS = [1, 5, 10, 25, 50, 100];
const AF_MARKS = [1, 7, 30, 100];

function nth(n: number): string {
  if (n === 1) return 'First';
  return `${n}th`;
}

/**
 * The recovery story: milestones derived from the user's own data plus
 * moments they pin themselves.
 */
export function useTimeline() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['timeline', userId],
    queryFn: async (): Promise<TimelineEntry[]> => {
      const [{ data: urges }, { data: afDays }, { data: custom }] =
        await Promise.all([
          supabase
            .from('urge_events')
            .select('created_at')
            .eq('user_id', userId!)
            .eq('outcome', 'passed')
            .order('created_at', { ascending: true }),
          supabase
            .from('alcohol_free_days')
            .select('date')
            .eq('user_id', userId!)
            .order('date', { ascending: true }),
          supabase
            .from('milestones')
            .select('*')
            .eq('user_id', userId!),
        ]);

      const entries: TimelineEntry[] = [];

      // Urges beaten milestones
      const urgeDates = (urges ?? []).map((u) => u.created_at.split('T')[0]);
      for (const mark of URGE_MARKS) {
        if (urgeDates.length >= mark) {
          entries.push({
            id: `urge-${mark}`,
            title: mark === 1 ? 'First urge, beaten' : `${mark} urges beaten`,
            date: urgeDates[mark - 1],
            derived: true,
          });
        }
      }

      // Alcohol-free day milestones
      const afList = (afDays ?? []).map((d) => d.date);
      for (const mark of AF_MARKS) {
        if (afList.length >= mark) {
          entries.push({
            id: `af-${mark}`,
            title:
              mark === 1
                ? 'First alcohol-free day marked'
                : `${mark} alcohol-free days`,
            date: afList[mark - 1],
            derived: true,
          });
        }
      }

      // First sober Friday and first sober Saturday — the hard ones
      for (const [dow, label] of [[5, 'Friday'], [6, 'Saturday']] as const) {
        const first = afList.find(
          (d) => new Date(d + 'T12:00:00').getDay() === dow,
        );
        if (first) {
          entries.push({
            id: `dow-${dow}`,
            title: `First alcohol-free ${label}`,
            date: first,
            derived: true,
          });
        }
      }

      // User-pinned moments
      for (const m of custom ?? []) {
        entries.push({
          id: m.id,
          title: m.title,
          date: m.happened_on,
          derived: false,
        });
      }

      return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    enabled: !!userId,
  });
}

export function useAddMilestone() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ title, date }: { title: string; date: string }) => {
      const { error } = await supabase
        .from('milestones')
        .insert({ user_id: userId!, title: title.trim(), happened_on: date });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['timeline', userId] }),
  });
}

export function useDeleteMilestone() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['timeline', userId] }),
  });
}
