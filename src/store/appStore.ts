import { create } from 'zustand';

type AppState = {
  activeSessionId: string | null;
  pauseModalVisible: boolean;
  morningReflectionDismissed: boolean;
  lastCheckinDate: string | null;
  drinkingPromptDismissedDate: string | null;
  setActiveSession: (id: string | null) => void;
  setPauseModalVisible: (visible: boolean) => void;
  dismissMorningReflection: () => void;
  setLastCheckinDate: (date: string) => void;
  dismissDrinkingPrompt: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeSessionId: null,
  pauseModalVisible: false,
  morningReflectionDismissed: false,
  lastCheckinDate: null,
  drinkingPromptDismissedDate: null,
  setActiveSession: (id) => set({ activeSessionId: id }),
  setPauseModalVisible: (visible) => set({ pauseModalVisible: visible }),
  dismissMorningReflection: () => set({ morningReflectionDismissed: true }),
  setLastCheckinDate: (date) => set({ lastCheckinDate: date }),
  dismissDrinkingPrompt: () =>
    set({ drinkingPromptDismissedDate: new Date().toISOString().split('T')[0] }),
}));
