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
    console.log('[AppIntentTrace] useWidgetSync: ExtensionStorage initialized', { appGroup: APP_GROUP });
  } catch (error) {
    console.log('[AppIntentTrace] useWidgetSync: STOP - ExtensionStorage initialization failed', error);
    storage = null;
  }
} else {
  console.log('[AppIntentTrace] useWidgetSync: STOP - platform is not iOS', { platform: Platform.OS });
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
  // Keep the shared count in step with the source of truth, so after the app
  // reconciles the App Intent's offline drinks the widget agrees.
  const drinksCount = (activeSession as any)?.drinks_count ?? 0;

  useEffect(() => {
    console.log('[AppIntentTrace] useWidgetSync: effect evaluated', {
      hasStorage: !!storage,
      urgesBeaten,
      afMonth,
      sessionStart,
      drinksCount,
    });
    if (!storage) {
      console.log('[AppIntentTrace] useWidgetSync: STOP - no shared storage bridge');
      return;
    }
    if (urgesBeaten === null) {
      console.log('[AppIntentTrace] useWidgetSync: STOP - urge stats not loaded');
      return;
    }
    if (afMonth === undefined) {
      console.log('[AppIntentTrace] useWidgetSync: STOP - AF month count not loaded');
      return;
    }
    try {
      console.log('[AppIntentTrace] useWidgetSync: writing widget shared state', {
        urgesBeaten,
        afDays: afMonth ?? 0,
        sessionActive: sessionStart > 0 ? 1 : 0,
        sessionStart,
        drinksCount: sessionStart > 0 ? drinksCount : 0,
      });
      // Numbers route to native setInt so Swift's integer(forKey:) reads real
      // Ints, not stringified values.
      storage.set('urgesBeaten', urgesBeaten);
      storage.set('afDays', afMonth ?? 0);
      storage.set('sessionActive', sessionStart > 0 ? 1 : 0);
      storage.set('sessionStart', sessionStart);
      storage.set('drinksCount', sessionStart > 0 ? drinksCount : 0);
      ExtensionStorage.reloadWidget();
      console.log('[AppIntentTrace] useWidgetSync: widget shared state write completed and reload requested');
    } catch (error) {
      console.log('[AppIntentTrace] useWidgetSync: STOP - widget shared state write failed', error);
      // Widget sync is best-effort — never let it touch the app.
    }
  }, [urgesBeaten, afMonth, sessionStart, drinksCount]);
}
