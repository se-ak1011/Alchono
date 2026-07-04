import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'toolkit-favourites-v1';

/**
 * Device-local "saved" tools. Deliberately lightweight — no backend, mirrors
 * the AsyncStorage pattern used by useMonthlyRecap. Survives app restarts.
 */
export function useToolkitFavourites() {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setIds(raw ? (JSON.parse(raw) as string[]) : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
    },
    [ids, persist],
  );

  return { ids, isSaved, toggle, loaded };
}
