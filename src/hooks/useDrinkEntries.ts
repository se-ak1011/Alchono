import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';

export type DiaryLine = { label: string; count: number; unitsEach: number; total: number };
export type DiaryDay = { date: string; label: string; lines: DiaryLine[]; dayTotal: number };
export type DrinksDiary = {
  days: DiaryDay[];
  weekTotal: number;
  dailyAverage: number;
  rangeDays: number;
  anyLogged: boolean;
};

/** Local YYYY-MM-DD for grouping by the day the drink actually happened. */
function localDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA'); // en-CA → ISO-like
}

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Log a single drink with its NHS units (from the preset picker). */
export function useLogDrinkEntry() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (entry: {
      drinkType: string;
      drinkLabel: string;
      units: number;
      sessionId?: string | null;
    }) => {
      const { error } = await (supabase as any).from('drink_entries').insert({
        user_id: userId!,
        session_id: entry.sessionId ?? null,
        drink_type: entry.drinkType,
        drink_label: entry.drinkLabel,
        units: entry.units,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drinks-diary'] });
    },
  });
}

/**
 * The weekly drinks diary, shaped like the GP's paper form: one row per day
 * (empty days included), each drink type with number of drinks, units each and
 * a daily total — plus the weekly total and daily average in units.
 */
export function useDrinksDiary(days = 7) {
  const userId = useAuthStore((s) => s.user?.id);
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);

  return useQuery<DrinksDiary>({
    queryKey: ['drinks-diary', userId, days],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('drink_entries')
        .select('occurred_at, drink_label, drink_type, units')
        .eq('user_id', userId!)
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: true });

      const entries = (data ?? []) as {
        occurred_at: string;
        drink_label: string | null;
        drink_type: string;
        units: number;
      }[];

      // Pre-seed every calendar day in the window (oldest first), like the form.
      const dayMap = new Map<string, DiaryDay>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toLocaleDateString('en-CA');
        dayMap.set(d, { date: d, label: dayLabel(d), lines: [], dayTotal: 0 });
      }

      for (const e of entries) {
        const date = localDate(e.occurred_at);
        const day = dayMap.get(date);
        if (!day) continue; // outside the window after local conversion
        const label = e.drink_label ?? e.drink_type;
        const units = Number(e.units) || 0;
        let line = day.lines.find((l) => l.label === label);
        if (!line) {
          line = { label, count: 0, unitsEach: units, total: 0 };
          day.lines.push(line);
        }
        line.count += 1;
        line.total += units;
        day.dayTotal += units;
      }

      const daysArr = Array.from(dayMap.values());
      const weekTotal = daysArr.reduce((s, d) => s + d.dayTotal, 0);
      return {
        days: daysArr,
        weekTotal,
        dailyAverage: weekTotal / days,
        rangeDays: days,
        anyLogged: entries.length > 0,
      };
    },
    enabled: !!userId,
  });
}
