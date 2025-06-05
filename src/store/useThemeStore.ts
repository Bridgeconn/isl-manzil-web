import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ThemeOption {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
}

interface ThemeStore {
  currentTheme: ThemeOption | null;
  themes: ThemeOption[];
  setTheme: (theme: ThemeOption) => void;
  applyTheme: () => void;
  initializeTheme: () => void;
}

const themes: ThemeOption[] = [
  {
    id: "theme1",
    name: "Theme 1",
    backgroundColor: "#FFFFFF",
    textColor: "#333333",
  },
  {
    id: "theme2",
    name: "Theme 2",
    backgroundColor: "#F5F5F5",
    textColor: "#1A1A7E",
  },
  {
    id: "theme3",
    name: "Theme 3",
    backgroundColor: "#FFE5B4",
    textColor: "#5C4033",
  },
];

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: null,
      themes: themes,

      setTheme: (theme: ThemeOption) => {
        set({ currentTheme: theme });
        get().applyTheme();
      },

      applyTheme: () => {
        const { currentTheme } = get();
        const root = document.documentElement;
        const mainElement = document.querySelector('.layout-main');

        if (currentTheme) {
          root.style.setProperty("--theme-bg-color", currentTheme.backgroundColor);
          root.style.setProperty("--theme-text-color", currentTheme.textColor);
          mainElement?.classList.add('theme-active');
        } else {
          mainElement?.classList.remove('theme-active');
          root.style.removeProperty("--theme-bg-color");
          root.style.removeProperty("--theme-text-color");
        }
      },

      initializeTheme: () => {
        const { currentTheme } = get();
        if (!currentTheme) {
          set({ currentTheme: themes[0] });
        }
        get().applyTheme();
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentTheme: state.currentTheme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

export default useThemeStore;