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
    console.log('[AppIntentTrace] useDrinkIntentSync: ExtensionStorage initialized', { appGroup: APP_GROUP });
  } catch (error) {
    console.log('[AppIntentTrace] useDrinkIntentSync: STOP - ExtensionStorage initialization failed', error);
    storage = null;
  }
} else {
  console.log('[AppIntentTrace] useDrinkIntentSync: STOP - platform is not iOS', { platform: Platform.OS });
}

// ExtensionStorage's read method isn't used elsewhere, so probe the likely
// names defensively. If none exists on a given build, reconciliation simply
// no-ops (the widget still reflects the intent; the count reconciles once a
// working read path ships).
async function readInt(key: string): Promise<number> {
  try {
    const s: any = storage;
    if (!s) {
      console.log('[AppIntentTrace] useDrinkIntentSync.readInt: STOP - storage unavailable', { key });
      return 0;
    }
    let v: unknown;
    let method = 'none';
    if (typeof s.get === 'function') {
      method = 'get';
      v = await s.get(key);
    } else if (typeof s.getItem === 'function') {
      method = 'getItem';
      v = await s.getItem(key);
    } else {
      console.log('[AppIntentTrace] useDrinkIntentSync.readInt: STOP - no supported read method', {
        key,
        availableMethods: Object.keys(s),
      });
      return 0;
    }
    const n = Number(v);
    const value = Number.isFinite(n) ? n : 0;
    console.log('[AppIntentTrace] useDrinkIntentSync.readInt: read shared value', { key, method, raw: v, value });
    return value;
  } catch (error) {
    console.log('[AppIntentTrace] useDrinkIntentSync.readInt: STOP - read failed', { key, error });
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
    console.log('[AppIntentTrace] useDrinkIntentSync: effect evaluated', {
      hasStorage: !!storage,
      hasUserId: !!userId,
    });
    if (!storage) {
      console.log('[AppIntentTrace] useDrinkIntentSync: STOP - no shared storage bridge');
      return;
    }
    if (!userId) {
      console.log('[AppIntentTrace] useDrinkIntentSync: STOP - no authenticated user');
      return;
    }

    const reconcile = async (trigger: 'mount' | 'foreground') => {
      console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: triggered', { trigger });
      if (reconcileInFlight.current) {
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: STOP - reconcile already in flight', { trigger });
        return;
      }
      reconcileInFlight.current = true;
      try {
        const pending = await readInt('pendingDrinks');
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: pending queue inspected', { pending });
        if (pending <= 0) {
          console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: STOP - no pending drinks');
          return;
        }
        const startSec = await readInt('pendingSessionStart');
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: pending session start inspected', { startSec });

        // Only drain the queue after Supabase accepts the existing drinking
        // session mutation. If another intent lands while this is in flight,
        // subtract only the batch we successfully logged and leave the rest for
        // the next foreground pass.
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: calling useLogDrink mutation', {
          add: pending,
          startedAtOverride: startSec > 0 ? startSec * 1000 : undefined,
        });
        const result = await logDrink({
          add: pending,
          startedAtOverride: startSec > 0 ? startSec * 1000 : undefined,
        });
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: useLogDrink mutation succeeded', result);

        try {
          const latestPending = await readInt('pendingDrinks');
          const remaining = Math.max(0, latestPending - pending);
          console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: clearing drained shared queue', {
            pending,
            latestPending,
            remaining,
          });
          storage.set('pendingDrinks', remaining);
          if (remaining === 0) storage.set('pendingSessionStart', 0);
          console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: shared queue clear completed');
        } catch (error) {
          console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: STOP - failed to clear shared queue', error);
        }
      } catch (error) {
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: STOP - reconciliation failed', error);
      } finally {
        reconcileInFlight.current = false;
        console.log('[AppIntentTrace] useDrinkIntentSync.reconcile: finished', { trigger });
      }
    };

    reconcile('mount');
    const sub = AppState.addEventListener('change', (s) => {
      console.log('[AppIntentTrace] useDrinkIntentSync: AppState changed', { state: s });
      if (s === 'active') reconcile('foreground');
    });
    return () => sub.remove();
  }, [userId, logDrink]);
}
