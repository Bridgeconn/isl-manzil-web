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
  fontType:"serif"|"sans";
  fontSize:number;
  setTheme: (theme: ThemeOption) => void;
  setFontType:(type:"serif"|"sans")=>void;
  setFontSize: (size: number) => void;
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

  fontType: "serif",
  fontSize: 16,

  setTheme: (theme: ThemeOption) => {
    set({ currentTheme: theme });
    get().applyTheme();
  },

  setFontType:(type)=> {
    set({fontType:type});
    get().applyTheme();
    
  },

  setFontSize:(size)=>{

    set({fontSize:size});
    get().applyTheme();
  },

  applyTheme: () => {
    const { currentTheme,fontType,fontSize } = get();
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
     const fontFamily =
    fontType === "serif"
      ? 'Helvetica, Arial, sans-serif'
      : 'Roboto, "Noto Sans", sans-serif';

  root.style.setProperty("--font-family", fontFamily);
  root.style.setProperty("--font-size", `${fontSize}px`);
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
      partialize: (state) => ({ currentTheme: state.currentTheme, fontType:state.fontType,fontSize:state.fontSize }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

export default useThemeStore;