import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export function useTodayCheckin() {
  const userId = useAuthStore((s) => s.user?.id);
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['checkin', userId, today],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId!)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();
      return data as {
        id: string;
        mood: string;
        mood_emoji?: string;
        created_at: string;
      } | null;
    },
    enabled: !!userId,
  });
}

export function useSubmitCheckin() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setLastCheckinDate } = useAppStore();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({
      mood,
      emoji,
      notes,
    }: {
      mood: string;
      emoji: string;
      notes?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('daily_checkins')
        .insert({
          user_id: userId!,
          mood,
          mood_emoji: emoji,
          notes: notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastCheckinDate(today);
      queryClient.invalidateQueries({ queryKey: ['checkin', userId, today] });
      queryClient.invalidateQueries({ queryKey: ['insights', userId] });
    },
  });
}

export function useUpdateCheckin() {
  const userId = useAuthStore((s) => s.user?.id);
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({
      id,
      mood,
      emoji,
    }: {
      id: string;
      mood: string;
      emoji: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('daily_checkins')
        .update({ mood, mood_emoji: emoji })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin', userId, today] });
      queryClient.invalidateQueries({ queryKey: ['insights', userId] });
    },
  });
}
