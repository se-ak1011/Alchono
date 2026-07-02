import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export function useActiveSession() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setActiveSession } = useAppStore();

  return useQuery({
    queryKey: ['active-session', userId],
    queryFn: async () => {
      // Order + limit so we always get the latest active session even if a
      // previous one was never ended (avoids PGRST116 from maybeSingle).
      const { data } = await supabase
        .from('drinking_sessions')
        .select('*')
        .eq('user_id', userId!)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveSession(data?.id ?? null);
      return data;
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useStartSession() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setActiveSession } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('drinking_sessions')
        .insert({ user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveSession(data.id);
      queryClient.invalidateQueries({ queryKey: ['active-session', userId] });
    },
  });
}

export function useEndSession() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setActiveSession } = useAppStore();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('drinking_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['active-session', userId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', userId] });
    },
  });
}

export function useIncrementPause() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      sessionId,
      currentCount,
    }: {
      sessionId: string;
      currentCount: number;
    }) => {
      const { error } = await supabase
        .from('drinking_sessions')
        .update({ paused_count: currentCount + 1 })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session', userId] });
    },
  });
}

export function useRecentSessions(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ['sessions', userId, days],
    queryFn: async () => {
      const { data } = await supabase
        .from('drinking_sessions')
        .select('*')
        .eq('user_id', userId!)
        .gte('started_at', since)
        .order('started_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
}
