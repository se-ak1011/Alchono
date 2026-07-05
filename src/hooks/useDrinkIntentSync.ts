import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useLogDrink } from '@/hooks/useDrinkingSession';
import { useAuthStore } from '@/store/authStore';

const APP_GROUP = 'group.com.alchono.app';

// Same lazy, fail-silent bridge as useWidgetSync — the native module only
// exists in builds made after the widget/App-Intents target was added.
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

// ExtensionStorage's read method isn't used elsewhere, so probe the likely
// names defensively. If none exists on a given build, reconciliation simply
// no-ops (the widget still reflects the intent; the count reconciles once a
// working read path ships).
async function readInt(key: string): Promise<number> {
  try {
    const s: any = storage;
    if (!s) return 0;
    let v: unknown;
    if (typeof s.get === 'function') v = await s.get(key);
    else if (typeof s.getItem === 'function') v = await s.getItem(key);
    else return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Drains drinks logged by the "I had a drink" App Intent while the app was
 * closed. The intent can't reach Supabase, so it queues drinks in the shared
 * App Group; here we apply them to the real session (creating one if needed,
 * backdated to when the first offline drink was logged) and clear the queue.
 * Runs on mount and whenever the app returns to the foreground.
 */
export function useDrinkIntentSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const { mutate: logDrink } = useLogDrink();

  useEffect(() => {
    if (!storage || !userId) return;

    const reconcile = async () => {
      const pending = await readInt('pendingDrinks');
      if (pending <= 0) return;
      const startSec = await readInt('pendingSessionStart');
      logDrink({
        add: pending,
        startedAtOverride: startSec > 0 ? startSec * 1000 : undefined,
      });
      // These are now the app's responsibility — clear so we never double-count.
      try {
        storage.set('pendingDrinks', 0);
        storage.set('pendingSessionStart', 0);
      } catch {
        /* best effort */
      }
    };

    reconcile();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') reconcile();
    });
    return () => sub.remove();
  }, [userId]);
}
