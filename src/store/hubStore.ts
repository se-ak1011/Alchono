import { create } from 'zustand';

/**
 * A tiny cross-screen note for the adventure hub. When you launch something
 * from a room that should return you to THAT room (e.g. an arcade game →
 * back to the arcade front view), the launcher sets `pendingNode`; the hub
 * consumes it the next time it regains focus and jumps there. Read/written
 * imperatively (getState) so it never triggers re-renders or stale closures.
 */
type HubStore = {
  pendingNode: string | null;
  setPendingNode: (node: string | null) => void;
};

export const useHubStore = create<HubStore>((set) => ({
  pendingNode: null,
  setPendingNode: (pendingNode) => set({ pendingNode }),
}));
