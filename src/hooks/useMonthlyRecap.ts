import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export type MonthlyRecap = {
  monthLabel: string; // "June"
  afDays: number;
  urgesBeaten: number;
  checkins: number;
};

/**
 * A gentle recap of last month, shown on home for the first 3 days of a new
 * month. Dismissal is remembered per month.
 */
export function useMonthlyRecap() {
  const userId = useAuthStore((s) => s.user?.id);
  const now = new Date();
  const inWindow = now.getDate() <= 3;

  // Previous month boundaries
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = `${prevStart.getFullYear()}-${prevStart.getMonth() + 1}`;
  const dismissKey = `recap-dismissed-${monthKey}`;

  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    if (!inWindow) return;
    AsyncStorage.getItem(dismissKey).then((v) => setDismissed(v === '1'));
  }, [dismissKey, inWindow]);

  const dismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(dismissKey, '1').catch(() => {});
  };

  const query = useQuery({
    queryKey: ['monthly-recap', userId, monthKey],
    queryFn: async (): Promise<MonthlyRecap> => {
      const startIso = prevStart.toISOString();
      const endIso = prevEnd.toISOString();
      const startDate = startIso.split('T')[0];
      const endDate = endIso.split('T')[0];

      const [{ count: af }, { count: urges }, { count: checkins }] =
        await Promise.all([
          supabase
            .from('alcohol_free_days')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
            .gte('date', startDate)
            .lt('date', endDate),
          supabase
            .from('urge_events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
            .eq('outcome', 'passed')
            .gte('created_at', startIso)
            .lt('created_at', endIso),
          supabase
            .from('daily_checkins')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
            .gte('created_at', startIso)
            .lt('created_at', endIso),
        ]);

      return {
        monthLabel: prevStart.toLocaleDateString('en-GB', { month: 'long' }),
        afDays: af ?? 0,
        urgesBeaten: urges ?? 0,
        checkins: checkins ?? 0,
      };
    },
    enabled: !!userId && inWindow && !dismissed,
    staleTime: Infinity,
  });

  const recap = query.data;
  const hasAnything =
    !!recap && (recap.afDays > 0 || recap.urgesBeaten > 0 || recap.checkins > 0);

  return {
    recap: inWindow && !dismissed && hasAnything ? recap : null,
    dismiss,
  };
}
