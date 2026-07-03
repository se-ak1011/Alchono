import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Alchono',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, push_token: token }, { onConflict: 'user_id' });
}

export async function scheduleCheckinReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alchono',
      body: 'How are you feeling today?',
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

export async function scheduleMorningReflection() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alchono',
      body: 'Take a moment to reflect on yesterday.',
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Drinking-session nudges ────────────────────────────────────────────────
// Gentle "slow down" buzzes while a session is live, so they reach you with
// the phone in your pocket. Personalised, escalating, capped, and silent
// through the small hours.

const SESSION_NUDGE_TAG = 'session-nudge';
const NUDGE_INTERVAL_MIN = 35; // a caring friend, not a smoke alarm
const NUDGE_COUNT = 5; // then it goes quiet on its own

type NudgePrefs = {
  partnerName?: string | null;
  childrenNames?: string | null;
  petName?: string | null;
  hasPets?: boolean | null;
  familyMembers?: string[] | null;
};

// Ordered gentle → firmer. Each returns null when it doesn't apply to this
// person, so we skip it and fall through to the next.
function buildNudgeBodies(prefs: NudgePrefs): string[] {
  const partner = prefs.familyMembers?.includes('partner') ? prefs.partnerName?.trim() : '';
  const pet = prefs.hasPets ? prefs.petName?.trim() : '';

  const pool: (string | null)[] = [
    'Glass of water before the next one?',
    'Eaten anything? It slows it all down.',
    pet ? `Take ${pet} out for five?` : (prefs.hasPets ? 'Take the dog out for five?' : null),
    'Make this next one a slow one.',
    partner ? `Text ${partner}. Even just "hey".` : 'Message someone. You don\'t have to sit in it alone.',
    'Another glass of water. Seriously.',
    'Car keys somewhere hard to reach yet?',
    'Pick your stopping point now, while it\'s still your call.',
  ];
  return pool.filter((b): b is string => !!b);
}

/**
 * Schedule the run of session nudges. Called when a session starts.
 * Any that would land between 2am and 8am are skipped so we never pester
 * through the night.
 */
export async function scheduleSessionNudges(prefs: NudgePrefs) {
  try {
    await cancelSessionNudges(); // never stack two sessions' worth

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('session', {
        name: 'During a session',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
      });
    }

    const bodies = buildNudgeBodies(prefs);

    for (let i = 1; i <= NUDGE_COUNT; i++) {
      const seconds = i * NUDGE_INTERVAL_MIN * 60;
      const fireAt = new Date(Date.now() + seconds * 1000);
      const hour = fireAt.getHours();
      // Quiet hours: skip anything landing in the small hours.
      if (hour >= 2 && hour < 8) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Still with you',
          body: bodies[(i - 1) % bodies.length],
          sound: 'default', // carries the buzz even from your pocket
          data: { type: SESSION_NUDGE_TAG },
        },
        trigger: {
          seconds,
          ...(Platform.OS === 'android' ? { channelId: 'session' } : {}),
        } as Notifications.TimeIntervalTriggerInput,
      });
    }
  } catch {
    // Best-effort — a missing permission or scheduling hiccup must never
    // block starting a session.
  }
}

/** Cancel any pending session nudges. Called when a session ends. */
export async function cancelSessionNudges() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data as any)?.type === SESSION_NUDGE_TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // no-op
  }
}
