import { create } from 'zustand';

interface MesaShellState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (value: boolean) => void;
  toggleMobileNav: () => void;
}

export const useMesaShellStore = create<MesaShellState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen }))
}));
