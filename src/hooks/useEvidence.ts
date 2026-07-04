import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export type EvidenceItem = { key: string; text: string };

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const day = (iso: string) => new Date(iso).getDay();
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Evidence — objective proof of progress drawn from the user's own behaviour,
 * for the days it doesn't *feel* like anything has changed. Every statement is
 * derived from real data and only shown when the data actually supports it.
 * Calm, factual, non-judgemental. Not motivation — evidence.
 */
export function useEvidence() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['evidence', userId],
    queryFn: async (): Promise<EvidenceItem[]> => {
      const now = Date.now();
      const d30 = new Date(now - 30 * 86400_000);
      const d60 = new Date(now - 60 * 86400_000);

      const [urgesRes, journalsRes, sessionsRes, choicesRes] = await Promise.all([
        supabase
          .from('urge_events')
          .select('outcome, duration_seconds, created_at')
          .eq('user_id', userId!),
        supabase
          .from('journal_entries')
          .select('created_at, notes, went_well')
          .eq('user_id', userId!),
        supabase.from('drinking_sessions').select('started_at').eq('user_id', userId!),
        supabase.from('daily_choices').select('id').eq('user_id', userId!),
      ]);

      const urges = (urgesRes.data ?? []) as any[];
      const journals = (journalsRes.data ?? []) as any[];
      const sessions = (sessionsRes.data ?? []) as any[];
      const choices = (choicesRes.data ?? []) as any[];

      const items: EvidenceItem[] = [];

      // 1. Urges ridden out (all-time)
      const passed = urges.filter((u) => u.outcome === 'passed').length;
      if (passed > 0) {
        items.push({ key: 'urges', text: `${passed} urges ridden out` });
      }

      // 2. Reflections completed
      if (journals.length > 0) {
        items.push({
          key: 'reflections',
          text: `${journals.length} reflection${journals.length === 1 ? '' : 's'} completed`,
        });
      }

      // 3. Positive choices logged
      if (choices.length > 0) {
        items.push({ key: 'choices', text: `${choices.length} positive choices logged` });
      }

      // 4. Cravings getting shorter — recent avg vs the month before
      const durMins = (u: any) =>
        typeof u.duration_seconds === 'number' ? u.duration_seconds / 60 : null;
      const recentDur = urges
        .filter((u) => new Date(u.created_at) >= d30)
        .map(durMins)
        .filter((m): m is number => m != null && m > 0);
      const priorDur = urges
        .filter((u) => {
          const t = new Date(u.created_at);
          return t < d30 && t >= d60;
        })
        .map(durMins)
        .filter((m): m is number => m != null && m > 0);
      if (recentDur.length >= 3 && priorDur.length >= 3) {
        const r = Math.round(avg(recentDur));
        const p = Math.round(avg(priorDur));
        if (r < p) {
          items.push({
            key: 'craving-time',
            text: `Cravings now pass in about ${r} minutes, down from ${p}`,
          });
        }
      }

      // 5. Good days trending up — last 30d vs the 30d before
      const goodDays = (from: Date, to: Date) =>
        new Set(
          journals
            .filter((j) => {
              const t = new Date(j.created_at);
              return t >= from && t < to && (j.went_well ?? []).length > 0;
            })
            .map((j) => j.created_at.split('T')[0]),
        ).size;
      const recentGood = goodDays(d30, new Date(now + 86400_000));
      const priorGood = goodDays(d60, d30);
      if (priorGood >= 2 && recentGood > priorGood) {
        const pct = Math.round(((recentGood - priorGood) / priorGood) * 100);
        items.push({ key: 'good-trend', text: `Good days up ${pct}% from the month before` });
      }

      // 6. Feeling proud, more than you used to
      const proudCount = (from: Date, to: Date) =>
        journals.filter((j) => {
          const t = new Date(j.created_at);
          return t >= from && t < to && (j.notes ?? '').toLowerCase().includes('proud');
        }).length;
      const recentProud = proudCount(d30, new Date(now + 86400_000));
      const priorProud = proudCount(d60, d30);
      if (recentProud > 0 && recentProud > priorProud) {
        items.push({
          key: 'proud',
          text: `You've written about feeling proud more than you used to`,
        });
      }

      // 7. Your strongest day of the week (fewest drinking sessions)
      if (sessions.length >= 6) {
        const counts = new Array(7).fill(0);
        for (const s of sessions) counts[day(s.started_at)]++;
        const min = Math.min(...counts);
        // Only call it out if one day is clearly lighter than the busiest.
        if (Math.max(...counts) - min >= 2) {
          const strongest = counts.indexOf(min);
          items.push({
            key: 'strong-day',
            text: `${DAY_NAMES[strongest]}s are consistently your strongest day`,
          });
        }
      }

      return items;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
