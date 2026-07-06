import { useEffect, useRef } from 'react';
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
  const { mutateAsync: logDrink } = useLogDrink();
  const reconcileInFlight = useRef(false);

  useEffect(() => {
    if (!storage || !userId) return;

    const reconcile = async () => {
      if (reconcileInFlight.current) return;
      reconcileInFlight.current = true;
      try {
        const pending = await readInt('pendingDrinks');
        if (pending <= 0) return;
        const startSec = await readInt('pendingSessionStart');

        // Only drain the queue after Supabase accepts the existing drinking
        // session mutation. If another intent lands while this is in flight,
        // subtract only the batch we successfully logged and leave the rest for
        // the next foreground pass.
        await logDrink({
          add: pending,
          startedAtOverride: startSec > 0 ? startSec * 1000 : undefined,
        });

        try {
          const latestPending = await readInt('pendingDrinks');
          const remaining = Math.max(0, latestPending - pending);
          storage.set('pendingDrinks', remaining);
          if (remaining === 0) storage.set('pendingSessionStart', 0);
        } catch {
          /* best effort */
        }
      } finally {
        reconcileInFlight.current = false;
      }
    };

    reconcile();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') reconcile();
    });
    return () => sub.remove();
  }, [userId, logDrink]);
}
