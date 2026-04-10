import { create } from 'zustand';

interface MesaShellState {
  mobileNavOpen: boolean;
  utilityOpen: boolean;
  setMobileNavOpen: (value: boolean) => void;
  setUtilityOpen: (value: boolean) => void;
  toggleMobileNav: () => void;
  toggleUtility: () => void;
}

export const useMesaShellStore = create<MesaShellState>((set) => ({
  mobileNavOpen: false,
  utilityOpen: false,
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  setUtilityOpen: (value) => set({ utilityOpen: value }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  toggleUtility: () => set((state) => ({ utilityOpen: !state.utilityOpen }))
}));
