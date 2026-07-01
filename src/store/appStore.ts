import { create } from 'zustand';

type AppState = {
  activeSessionId: string | null;
  pauseModalVisible: boolean;
  morningReflectionDismissed: boolean;
  lastCheckinDate: string | null;
  alcoholFreeTodayDate: string | null;
  setActiveSession: (id: string | null) => void;
  setPauseModalVisible: (visible: boolean) => void;
  dismissMorningReflection: () => void;
  setLastCheckinDate: (date: string) => void;
  setAlcoholFreeToday: () => void;
  clearAlcoholFreeToday: () => void;
  reset: () => void;
};

const initialState = {
  activeSessionId: null,
  pauseModalVisible: false,
  morningReflectionDismissed: false,
  lastCheckinDate: null,
  alcoholFreeTodayDate: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setActiveSession: (id) => set({ activeSessionId: id }),
  setPauseModalVisible: (visible) => set({ pauseModalVisible: visible }),
  dismissMorningReflection: () => set({ morningReflectionDismissed: true }),
  setLastCheckinDate: (date) => set({ lastCheckinDate: date }),
  setAlcoholFreeToday: () =>
    set({ alcoholFreeTodayDate: new Date().toISOString().split('T')[0] }),
  clearAlcoholFreeToday: () => set({ alcoholFreeTodayDate: null }),
  reset: () => set(initialState),
}));
