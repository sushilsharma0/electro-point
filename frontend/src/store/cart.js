import { create } from 'zustand';

export const useCartUi = create((set) => ({
  drawerOpen: false,
  addedPulse: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  pulse: () => {
    set({ addedPulse: true });
    setTimeout(() => set({ addedPulse: false }), 1200);
  },
}));
