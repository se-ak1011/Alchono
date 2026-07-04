import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export type InsightData = {
  date: string;
  mood: string | null;
  hadSession: boolean;
  triggers: string[];
};

export function useInsights(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ['insights', userId, days],
    queryFn: async () => {
      const [checkinsRes, sessionsRes, journalsRes] = await Promise.all([
        supabase
          .from('daily_checkins')
          .select('created_at, mood')
          .eq('user_id', userId!)
          .gte('created_at', since)
          .order('created_at', { ascending: true }),
        supabase
          .from('drinking_sessions')
          .select('started_at, ended_at')
          .eq('user_id', userId!)
          .gte('started_at', since)
          .order('started_at', { ascending: true }),
        supabase
          .from('journal_entries')
          .select('created_at, triggers')
          .eq('user_id', userId!)
          .gte('created_at', since)
          .order('created_at', { ascending: true }),
      ]);

      const checkins = checkinsRes.data ?? [];
      const sessions = sessionsRes.data ?? [];
      const journals = journalsRes.data ?? [];

      const dateMap = new Map<string, InsightData>();

      for (const c of checkins) {
        const date = c.created_at.split('T')[0];
        // Store only the first mood value so charts that expect a single string still work
        const primaryMood = c.mood?.split(',')[0] ?? c.mood;
        dateMap.set(date, {
          date,
          mood: primaryMood,
          hadSession: false,
          triggers: [],
        });
      }

      for (const s of sessions) {
        const date = s.started_at.split('T')[0];
        const existing = dateMap.get(date) ?? {
          date,
          mood: null,
          hadSession: false,
          triggers: [],
        };
        dateMap.set(date, { ...existing, hadSession: true });
      }

      for (const j of journals) {
        const date = j.created_at.split('T')[0];
        // Create the day if it doesn't exist yet — otherwise a reflection saved
        // on a day with no check-in/session would be silently dropped, and its
        // triggers would never reach the Patterns chart.
        const existing = dateMap.get(date) ?? {
          date,
          mood: null,
          hadSession: false,
          triggers: [],
        };
        dateMap.set(date, {
          ...existing,
          triggers: [...existing.triggers, ...(j.triggers ?? [])],
        });
      }

      return Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
    },
    enabled: !!userId,
  });
}

export function useStreak() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from('drinking_sessions')
        .select('started_at')
        .eq('user_id', userId!)
        .order('started_at', { ascending: false })
        .limit(1);

      const lastSessionDate = sessions?.[0]?.started_at
        ? new Date(sessions[0].started_at)
        : null;

      if (!lastSessionDate) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId!)
          .single();

        const startDate = profile?.created_at
          ? new Date(profile.created_at)
          : new Date();
        const days = Math.floor(
          (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return { streak: days, lastSessionDate: null };
      }

      const daysSince = Math.floor(
        (Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { streak: daysSince, lastSessionDate };
    },
    enabled: !!userId,
  });
}

export function useTotalPauses(days: number) {
  const userId = useAuthStore((s) => s.user?.id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ['total-pauses', userId, days],
    queryFn: async () => {
      const { data } = await supabase
        .from('drinking_sessions')
        .select('paused_count')
        .eq('user_id', userId!)
        .gte('started_at', since);
      return (data ?? []).reduce((sum, s) => sum + (s.paused_count ?? 0), 0);
    },
    enabled: !!userId,
  });
}
