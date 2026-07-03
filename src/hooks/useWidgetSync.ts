import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';

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

/** Mirrors the member's headline stats into the home-screen widget. */
export function useWidgetSync() {
  const { data: urgeStats } = useUrgeStats();
  const { data: afMonth } = useAfMonthCount();

  const urgesBeaten = urgeStats?.allTimePassed ?? null;

  useEffect(() => {
    if (!storage || urgesBeaten === null || afMonth === undefined) return;
    try {
      // Numbers route to the native setInt so Swift's integer(forKey:) reads
      // a real Int, not a stringified value.
      storage.set('urgesBeaten', urgesBeaten);
      storage.set('afDays', afMonth ?? 0);
      ExtensionStorage.reloadWidget();
    } catch {
      // Widget sync is best-effort — never let it touch the app.
    }
  }, [urgesBeaten, afMonth]);
}
