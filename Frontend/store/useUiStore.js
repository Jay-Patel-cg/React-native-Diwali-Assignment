import { create } from 'zustand';

export const useUiStore = create((set) => ({
  toast: null, // { type: 'info' | 'success' | 'error' | 'warning', message: string }

  showToast: (message, type = 'info') =>
    set({ toast: { id: Date.now(), message, type } }),

  hideToast: () => set({ toast: null }),
}));

export default useUiStore;

