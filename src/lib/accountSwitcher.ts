import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Device-level account switcher (testing/admin convenience).
 * Stores session token pairs so accounts can be swapped without
 * re-entering credentials. Tokens live in AsyncStorage — the same
 * place the active Supabase session already lives.
 *
 * Token snapshots die whenever that account's refresh token is revoked
 * (signing out of it does exactly that), so as a persistence fallback the
 * password can be kept in the device Keychain (SecureStore): the first
 * failed switch asks for it once, every switch after that just works.
 */

const KEY = 'saved-accounts-v1';

const passwordKey = (userId: string) => `switcher-pw-${userId.replace(/[^a-zA-Z0-9._-]/g, '')}`;

export async function savePassword(userId: string, password: string) {
  try {
    await SecureStore.setItemAsync(passwordKey(userId), password);
  } catch {
    // Keychain unavailable — switching will just ask again next time.
  }
}

async function getPassword(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(passwordKey(userId));
  } catch {
    return null;
  }
}

/** Thrown when both the token snapshot and any stored password failed. */
export class NeedsPasswordError extends Error {
  constructor(public account: SavedAccount) {
    super('Saved session expired — enter the password once to keep this account switchable.');
    this.name = 'NeedsPasswordError';
  }
}

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
  SecureStore.deleteItemAsync(passwordKey(userId)).catch(() => {});
  return next;
}

/**
 * Swap to a saved account. Snapshots the CURRENT session first (so its
 * freshest tokens survive the swap), then adopts the target session.
 * If the snapshot's tokens are dead, falls back to a Keychain-stored
 * password; if there is none, throws NeedsPasswordError so the UI can
 * ask for it once.
 */
export async function switchToAccount(target: SavedAccount, password?: string) {
  const { data: current } = await supabase.auth.getSession();
  if (current.session && current.session.user.id !== target.userId) {
    await updateIfSaved(current.session);
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: target.accessToken,
    refresh_token: target.refreshToken,
  });
  if (!error && data.session) {
    await updateIfSaved(data.session);
    return;
  }

  // Token snapshot is dead — sign in with a password instead.
  const pw = password ?? (await getPassword(target.userId));
  if (!pw) throw new NeedsPasswordError(target);

  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: target.email,
    password: pw,
  });
  if (signInError || !signIn.session) {
    throw new Error(
      signInError?.message ?? 'Could not sign in — check the password and try again.',
    );
  }
  await savePassword(target.userId, pw);
  await updateIfSaved(signIn.session);
}
