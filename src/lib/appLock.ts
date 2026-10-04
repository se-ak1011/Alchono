import * as SecureStore from 'expo-secure-store';

/**
 * App-lock PIN storage.
 *
 * The PIN lives in the device Keychain / Keystore (expo-secure-store), which is
 * hardware-encrypted at rest — the right place for a local app-lock secret. This
 * lock sits on top of the account login: it stops someone who picks up an
 * already-unlocked phone from opening the journal. Forgetting the PIN is
 * recoverable by signing out and back in (see the lock screen), so no one is
 * ever permanently locked out of their own data.
 */
const PIN_KEY = 'alchono-app-lock-pin-v1';

export async function isPinSet(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(PIN_KEY);
    return !!v;
  } catch {
    return false;
  }
}

export async function setPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return !!stored && stored === pin;
  } catch {
    return false;
  }
}

export async function clearPin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch {
    // Nothing stored or Keychain unavailable — treat as already clear.
  }
}
