import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Device-level account switcher (testing/admin convenience).
 * Stores session token pairs so accounts can be swapped without
 * re-entering credentials. Tokens live in AsyncStorage — the same
 * place the active Supabase session already lives.
 */

const KEY = 'saved-accounts-v1';

export type SavedAccount = {
  userId: string;
  email: string;
  label: string; // username at save time
  accessToken: string;
  refreshToken: string;
  savedAt: string;
};

export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAccount[]) : [];
  } catch {
    return [];
  }
}

async function persist(list: SavedAccount[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function saveAccount(session: Session, label: string) {
  const list = await getSavedAccounts();
  const entry: SavedAccount = {
    userId: session.user.id,
    email: session.user.email ?? 'unknown',
    label,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...list.filter((a) => a.userId !== session.user.id)];
  await persist(next);
  return next;
}

/** Keep stored tokens fresh whenever a known account's session rotates. */
export async function updateIfSaved(session: Session | null) {
  if (!session) return;
  const list = await getSavedAccounts();
  const idx = list.findIndex((a) => a.userId === session.user.id);
  if (idx === -1) return;
  list[idx] = {
    ...list[idx],
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    savedAt: new Date().toISOString(),
  };
  await persist(list);
}

export async function removeAccount(userId: string) {
  const list = await getSavedAccounts();
  const next = list.filter((a) => a.userId !== userId);
  await persist(next);
  return next;
}

/**
 * Swap to a saved account. Snapshots the CURRENT session first (so its
 * freshest tokens survive the swap), then adopts the target session.
 * Throws if the target's tokens are no longer valid — sign in manually
 * once and re-save in that case.
 */
export async function switchToAccount(target: SavedAccount) {
  const { data: current } = await supabase.auth.getSession();
  if (current.session && current.session.user.id !== target.userId) {
    await updateIfSaved(current.session);
  }
  const { data, error } = await supabase.auth.setSession({
    access_token: target.accessToken,
    refresh_token: target.refreshToken,
  });
  if (error || !data.session) {
    throw new Error(
      'That saved session has expired. Sign into the account once and save it again.',
    );
  }
  // Store the rotated tokens immediately.
  await updateIfSaved(data.session);
}
