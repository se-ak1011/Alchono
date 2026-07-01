import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { Goal } from '@/types';

export function useGoals() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const prefs = (profile?.preferences as any) ?? {};
  const goals: Goal[] = Array.isArray(prefs.goals) ? prefs.goals : [];

  const persist = useCallback(
    (next: Goal[]) => {
      if (!profile) return;
      const nextPrefs = { ...prefs, goals: next };
      setProfile({ ...profile, preferences: nextPrefs });
      supabase
        .from('profiles')
        .update({ preferences: nextPrefs })
        .eq('id', profile.id)
        .then(() => {})
        .catch(() => {});
    },
    [profile, prefs, setProfile],
  );

  const addGoal = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const goal: Goal = {
        id: Date.now().toString(),
        text: text.trim(),
        addedAt: new Date().toISOString(),
      };
      persist([...goals, goal]);
    },
    [goals, persist],
  );

  const removeGoal = useCallback(
    (id: string) => {
      persist(goals.filter((g) => g.id !== id));
    },
    [goals, persist],
  );

  return { goals, addGoal, removeGoal };
}
