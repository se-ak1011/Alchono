import { create } from 'zustand';

type AppState = {
  activeSessionId: string | null;
  pauseModalVisible: boolean;
  morningReflectionDismissed: boolean;
  choosingDismissed: boolean;
  lastCheckinDate: string | null;
  setActiveSession: (id: string | null) => void;
  setPauseModalVisible: (visible: boolean) => void;
  dismissMorningReflection: () => void;
  dismissChoosing: () => void;
  setLastCheckinDate: (date: string) => void;
  reset: () => void;
};

const initialState = {
  activeSessionId: null,
  pauseModalVisible: false,
  morningReflectionDismissed: false,
  choosingDismissed: false,
  lastCheckinDate: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setActiveSession: (id) => set({ activeSessionId: id }),
  setPauseModalVisible: (visible) => set({ pauseModalVisible: visible }),
  dismissMorningReflection: () => set({ morningReflectionDismissed: true }),
  dismissChoosing: () => set({ choosingDismissed: true }),
  setLastCheckinDate: (date) => set({ lastCheckinDate: date }),
  reset: () => set(initialState),
}));
