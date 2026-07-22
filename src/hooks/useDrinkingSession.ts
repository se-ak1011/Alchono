import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { scheduleSessionNudges, cancelSessionNudges } from '@/lib/notifications';
import type { UserPreferences } from '@/types';

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
    onSuccess: async (data) => {
      setActiveSession(data.id);
      queryClient.invalidateQueries({ queryKey: ['active-session', userId] });
      // Start the gentle "slow down" nudges — unless they've turned them off.
      const prefs = (useAuthStore.getState().profile?.preferences ??
        null) as UserPreferences | null;
      const { data: np } = await supabase
        .from('notification_preferences')
        .select('session_nudges')
        .eq('user_id', userId!)
        .maybeSingle();
      // Opt-in: only buzz if they've deliberately turned nudges on. These
      // personalise to loved ones ("Text Marta…") and buzz for ~3h after a
      // session goes live — too intimate to inflict on anyone who never chose it.
      if (prefs && np?.session_nudges === true) scheduleSessionNudges(prefs);
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
      // Session's over — stop any pending nudges.
      cancelSessionNudges();
    },
  });
}

/**
 * Log a drink — the single source of truth the tap-button AND the iOS App
 * Intent both flow through. If no session is active it starts one (drinks = 1);
 * otherwise it adds one to the active session. Returns the new count.
 *
 * `startedAtOverride` lets the intent-reconciler backdate a session to when the
 * drink was actually logged offline (epoch ms), and `add` batches several
 * pending drinks from the App Group in one write.
 */
export function useLogDrink() {
  const userId = useAuthStore((s) => s.user?.id);
  const { setActiveSession } = useAppStore();

  return useMutation({
    mutationFn: async (opts?: { add?: number; startedAtOverride?: number }) => {
      const add = Math.max(1, opts?.add ?? 1);
      console.log('[AppIntentTrace] useLogDrink: mutation started', {
        userId,
        add,
        startedAtOverride: opts?.startedAtOverride,
      });

      // Fresh read — the intent may have run while the app was closed, so
      // don't trust cached state.
      const { data: active } = await (supabase as any)
        .from('drinking_sessions')
        .select('id, drinks_count')
        .eq('user_id', userId!)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      console.log('[AppIntentTrace] useLogDrink: active session lookup completed', {
        hasActiveSession: !!active?.id,
        sessionId: active?.id,
        drinksCount: active?.drinks_count,
      });

      if (active?.id) {
        const next = (active.drinks_count ?? 0) + add;
        console.log('[AppIntentTrace] useLogDrink: updating active session drink count', {
          sessionId: active.id,
          previous: active.drinks_count ?? 0,
          add,
          next,
        });
        const { error } = await (supabase as any)
          .from('drinking_sessions')
          .update({ drinks_count: next })
          .eq('id', active.id);
        if (error) {
          console.log('[AppIntentTrace] useLogDrink: STOP - active session update failed', error);
          throw error;
        }
        console.log('[AppIntentTrace] useLogDrink: active session update succeeded', { sessionId: active.id, count: next });
        return { sessionId: active.id as string, count: next, created: false };
      }

      // No active session — start one, seeded with the drink(s).
      const insert: Record<string, unknown> = { user_id: userId!, drinks_count: add };
      if (opts?.startedAtOverride) {
        insert.started_at = new Date(opts.startedAtOverride).toISOString();
      }
      console.log('[AppIntentTrace] useLogDrink: creating session for logged drink(s)', insert);
      const { data, error } = await (supabase as any)
        .from('drinking_sessions')
        .insert(insert)
        .select()
        .single();
      if (error) {
        console.log('[AppIntentTrace] useLogDrink: STOP - session insert failed', error);
        throw error;
      }
      console.log('[AppIntentTrace] useLogDrink: session insert succeeded', { sessionId: data.id, count: add });
      return { sessionId: data.id as string, count: add, created: true };
    },
    onSuccess: async (res) => {
      console.log('[AppIntentTrace] useLogDrink: onSuccess started', res);
      setActiveSession(res.sessionId);
      queryClient.invalidateQueries({ queryKey: ['active-session', userId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', userId] });
      // A freshly-started session gets the same gentle nudges as useStartSession.
      if (res.created) {
        const prefs = (useAuthStore.getState().profile?.preferences ??
          null) as UserPreferences | null;
        const { data: np } = await supabase
          .from('notification_preferences')
          .select('session_nudges')
          .eq('user_id', userId!)
          .maybeSingle();
        // Opt-in — same guard as useStartSession (see note there).
        if (prefs && np?.session_nudges === true) scheduleSessionNudges(prefs);
      }
      console.log('[AppIntentTrace] useLogDrink: onSuccess completed', res);
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
