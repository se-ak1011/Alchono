import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';
import { useActiveSession } from '@/hooks/useDrinkingSession';

const APP_GROUP = 'group.com.alchono.app';

// The native module only exists in builds made after the widget target was
// added — require lazily and fail silent so older builds keep working.
let ExtensionStorage: any = null;
let storage: any = null;
if (Platform.OS === 'ios') {
  try {
    ExtensionStorage = require('@bacons/apple-targets').ExtensionStorage;
    storage = new ExtensionStorage(APP_GROUP);
  } catch {
    storage = null;
  }
}

/**
 * Mirrors the member's state into the home-screen widget:
 * - idle  → grey card with urges beaten / AF days this month
 * - session active → black card with a live timer + rotating nudge
 */
export function useWidgetSync() {
  const { data: urgeStats } = useUrgeStats();
  const { data: afMonth } = useAfMonthCount();
  const { data: activeSession } = useActiveSession();

  const urgesBeaten = urgeStats?.allTimePassed ?? null;
  // Epoch SECONDS of the session start (or 0). The Swift side rebuilds a Date
  // from this and lets SwiftUI's .timer style count up on its own.
  const sessionStart = activeSession?.started_at
    ? Math.floor(new Date(activeSession.started_at).getTime() / 1000)
    : 0;

  useEffect(() => {
    if (!storage || urgesBeaten === null || afMonth === undefined) return;
    try {
      // Numbers route to native setInt so Swift's integer(forKey:) reads real
      // Ints, not stringified values.
      storage.set('urgesBeaten', urgesBeaten);
      storage.set('afDays', afMonth ?? 0);
      storage.set('sessionActive', sessionStart > 0 ? 1 : 0);
      storage.set('sessionStart', sessionStart);
      ExtensionStorage.reloadWidget();
    } catch {
      // Widget sync is best-effort — never let it touch the app.
    }
  }, [urgesBeaten, afMonth, sessionStart]);
}
