import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRecentSessions } from '@/hooks/useDrinkingSession';

const SMART_REMINDER_ID = 'smart-risky-window';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Learns the user's risky window from their own session history and
 * schedules a weekly local nudge ~30 minutes before it. Local only —
 * no push infrastructure needed. Respects the drinking_reminders pref.
 */
export function useSmartReminder() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: sessions } = useRecentSessions(90);

  useEffect(() => {
    if (!userId || !sessions) return;

    (async () => {
      try {
        // Respect the user's notification preference.
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('drinking_reminders')
          .eq('user_id', userId)
          .maybeSingle();
        if (prefs?.drinking_reminders === false) {
          await Notifications.cancelScheduledNotificationAsync(SMART_REMINDER_ID).catch(() => {});
          return;
        }

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        // Find the (weekday, hour) bucket where sessions cluster.
        const counts: Record<string, number> = {};
        for (const s of sessions) {
          const d = new Date(s.started_at);
          const key = `${d.getDay()}-${d.getHours()}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
        const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
        if (!top || top[1] < 3) {
          // Not enough signal — clear any previous schedule.
          await Notifications.cancelScheduledNotificationAsync(SMART_REMINDER_ID).catch(() => {});
          return;
        }

        const [dayStr, hourStr] = top[0].split('-');
        const day = Number(dayStr);
        const hour = Number(hourStr);
        // 30 minutes before the risky hour.
        const notifHour = hour === 0 ? 23 : hour - 1;
        const notifDay = hour === 0 ? (day === 0 ? 6 : day - 1) : day;

        await Notifications.cancelScheduledNotificationAsync(SMART_REMINDER_ID).catch(() => {});
        await Notifications.scheduleNotificationAsync({
          identifier: SMART_REMINDER_ID,
          content: {
            title: 'Alchono',
            body: `${DAY_NAMES[day]}s around ${hour}:00 have been heavy lately. What's the plan for tonight?`,
          },
          trigger: {
            weekday: notifDay + 1, // expo: 1 = Sunday
            hour: notifHour,
            minute: 30,
            repeats: true,
          },
        });
      } catch {
        // Never let reminder plumbing break the home screen.
      }
    })();
  }, [userId, sessions?.length]);
}
