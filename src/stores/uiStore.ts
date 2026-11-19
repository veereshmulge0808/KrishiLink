import { create } from 'zustand';

interface UiState {
  darkMode: boolean;
  sidebarOpen: boolean;
  maskedCallModal: {
    isOpen: boolean;
    tripId?: string;
    orderId?: string;
    targetName?: string;
    targetPhone?: string;
    targetRole?: string;
  };
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  openMaskedCall: (info: {
    tripId?: string;
    orderId?: string;
    targetName?: string;
    targetPhone?: string;
    targetRole?: string;
  }) => void;
  closeMaskedCall: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  darkMode: false,
  sidebarOpen: true,
  maskedCallModal: { isOpen: false },

  toggleDarkMode: () => {
    set((state) => {
      const next = !state.darkMode;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { darkMode: next };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openMaskedCall: (info) =>
    set({
      maskedCallModal: {
        isOpen: true,
        ...info,
      },
    }),

  closeMaskedCall: () =>
    set({
      maskedCallModal: { isOpen: false },
    }),
}));
