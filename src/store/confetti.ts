
import { create } from 'zustand';

interface ConfettiState {
  isActive: boolean;
  addConfetti: () => void;
  clearConfetti: () => void;
}

export const useConfettiStore = create<ConfettiState>((set) => ({
  isActive: false,
  addConfetti: () => set({ isActive: true }),
  clearConfetti: () => set({ isActive: false }),
}));
