import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Goal } from '@/types';

export function useGoals() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useAddGoal() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, targetDate }: { text: string; targetDate?: string | null }) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: userId!, text, target_date: targetDate ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  });
}

export function useCompleteGoal() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  });
}

export function useDeleteGoal() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  });
}

export function formatTargetDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  // Day 1 is the month-only convention (see MonthYearPicker); a specific
  // day was chosen only when the date is past the 1st.
  if (d.getDate() > 1) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}
