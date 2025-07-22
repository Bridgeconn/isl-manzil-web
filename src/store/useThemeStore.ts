import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ThemeOption {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  verseColor: string;
  selected: string
}

interface ThemeStore {
  currentTheme: ThemeOption | null;
  themes: ThemeOption[];
  fontType: "serif" | "sans";
  fontSize: number;
  setTheme: (theme: ThemeOption) => void;
  setFontType: (type: "serif" | "sans") => void;
  setFontSize: (size: number) => void;
  applyTheme: () => void;
  initializeTheme: () => void;
  validateAndSetTheme: (storedTheme: ThemeOption | null) => void;
}

const themes: ThemeOption[] = [
  {
    id: "theme1",
    name: "Theme 1",
    backgroundColor: "#FFFFFF",
    textColor: "#000063",
    verseColor: "#777777",
    selected: "#1e3a8a"
  },
   {
    id: "theme2",
    name: "Theme 2",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    verseColor: "#777777",
    selected: "#4b5563"
  },
  {
    id: "theme3",
    name: "Theme 3",
    backgroundColor: "#001F3F",
    textColor: "#E0E0E0",
    verseColor: "#ADD8E6",
    selected: "#D1D5DB"
  },
];

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: null,
      themes: themes,

      fontType: "serif",
      fontSize: 16,

      setTheme: (theme: ThemeOption) => {
        set({ currentTheme: theme });
        get().applyTheme();
      },

      setFontType: (type) => {
        set({ fontType: type });
        get().applyTheme();
      },

      setFontSize: (size) => {
        set({ fontSize: size });
        get().applyTheme();
      },

      applyTheme: () => {
        const { currentTheme, fontType, fontSize } = get();
        const root = document.documentElement;
        const mainElement = document.querySelector(".layout-main");

        if (currentTheme) {
          root.style.setProperty(
            "--theme-bg-color",
            currentTheme.backgroundColor
          );
          root.style.setProperty("--theme-text-color", currentTheme.textColor);
          root.style.setProperty("--verse-color", currentTheme.verseColor);
          mainElement?.classList.add("theme-active");
        } else {
          mainElement?.classList.remove("theme-active");
          root.style.removeProperty("--theme-bg-color");
          root.style.removeProperty("--theme-text-color");
          root.style.removeProperty("--verse-color");
        }

        const fontFamily =
          fontType === "serif"
            ? 'Georgia, Cambria, "Times New Roman", Times, serif'
            : 'Roboto, "Noto Sans", Helvetica, Arial, sans-serif';

        root.style.setProperty("--font-family", fontFamily);
        root.style.setProperty("--font-size", `${fontSize}px`);
      },

      validateAndSetTheme: (storedTheme: ThemeOption | null) => {
        const { themes } = get();
        
        if (!storedTheme) {
          set({ currentTheme: themes[0] });
          return;
        }

        //Check if the stored theme exists in current themes
        const isValidTheme = themes.some(theme => 
          theme.id === storedTheme.id &&
          theme.backgroundColor === storedTheme.backgroundColor &&
          theme.textColor === storedTheme.textColor && theme.verseColor === storedTheme.verseColor
        );

        if (isValidTheme) {
          set({ currentTheme: storedTheme });
        } else {
          set({ currentTheme: themes[0] });
        }
      },

      initializeTheme: () => {
        const { currentTheme } = get();
        get().validateAndSetTheme(currentTheme);
        get().applyTheme();
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        fontType: state.fontType,
        fontSize: state.fontSize,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

export default useThemeStore;