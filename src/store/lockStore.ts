import { create } from 'zustand';

/**
 * App-lock UI state. Whether a PIN exists lives in SecureStore (see
 * src/lib/appLock.ts); this store mirrors it for the UI plus the current
 * locked/unlocked state so LockGate can react instantly.
 */
type LockState = {
  /** A PIN is configured on this device. */
  hasPin: boolean;
  /** The app is currently locked and needs the PIN to open. */
  isLocked: boolean;
  /** We've read SecureStore at least once since launch. */
  checked: boolean;
  setHasPin: (hasPin: boolean) => void;
  lock: () => void;
  unlock: () => void;
  setChecked: (checked: boolean) => void;
};

export const useLockStore = create<LockState>((set) => ({
  hasPin: false,
  isLocked: false,
  checked: false,
  setHasPin: (hasPin) => set({ hasPin }),
  // Only actually lock when a PIN exists.
  lock: () => set((s) => (s.hasPin ? { isLocked: true } : { isLocked: false })),
  unlock: () => set({ isLocked: false }),
  setChecked: (checked) => set({ checked }),
}));
