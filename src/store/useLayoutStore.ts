import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextPosition = "below" | "right" | "hidden";

interface LayoutControlState {
  textPosition: TextPosition;
  showText: boolean;
  isHorizontalLayout: boolean;
  canTogglePosition: boolean;
  userManuallyToggled: boolean;
  isInitialized: boolean;
}

interface LayoutActions {
  toggleTextVisibility: () => void;
  toggleTextPosition: () => void;
  setTextPosition: (position: TextPosition) => void;
  updateLayoutFromDevice: (params: {
    shouldUseHorizontalLayout: boolean;
    deviceType: string;
    isMobileLandscape: boolean;
    isMobilePortrait: boolean;
    isTabletLandscape: boolean;
    isTabletPortrait: boolean;
    isLowHeightDesktop: boolean
  }) => void;
  initializeLayout: (params: {
    shouldUseHorizontalLayout: boolean;
    isTabletLandscape: boolean;
    deviceType: string;
    isLowHeightDesktop: boolean
  }) => void;
}

type LayoutStore = LayoutControlState & LayoutActions;

const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      textPosition: "right",
      showText: true,
      isHorizontalLayout: true,
      canTogglePosition: true,
      userManuallyToggled: false,
      isInitialized: false,

      initializeLayout: ({ shouldUseHorizontalLayout, isTabletLandscape, deviceType, isLowHeightDesktop }) => {
        const currentState = get();
        
        if (currentState.isInitialized && currentState.userManuallyToggled) {
          const canTogglePosition = !isLowHeightDesktop && shouldUseHorizontalLayout && deviceType !== "mobile";
          set({
            isHorizontalLayout: shouldUseHorizontalLayout,
            canTogglePosition,
          });
          return;
        }
        
        const initialTextPosition = shouldUseHorizontalLayout || isTabletLandscape || isLowHeightDesktop ? "right" : "below";
        const canTogglePosition = !isLowHeightDesktop && shouldUseHorizontalLayout && deviceType !== "mobile";
        
        set({
          textPosition: initialTextPosition,
          showText: true,
          isHorizontalLayout: shouldUseHorizontalLayout,
          canTogglePosition,
          isInitialized: true,
        });
      },

      updateLayoutFromDevice: ({ 
        shouldUseHorizontalLayout, 
        deviceType,
        isMobileLandscape, 
        isMobilePortrait,
        isTabletLandscape, 
        isTabletPortrait,
        isLowHeightDesktop
      }) => {
        const currentState = get();
        let newTextPosition = currentState.textPosition;
        let canTogglePosition = !isLowHeightDesktop && shouldUseHorizontalLayout && deviceType !== "mobile";

        if (deviceType === "mobile" || deviceType === "tablet") {
          if (isMobileLandscape || isTabletLandscape) {
            newTextPosition = "right";
          } else if (isMobilePortrait || isTabletPortrait) {
            newTextPosition = "below";
          }
          canTogglePosition = false;
          
          set({
            isHorizontalLayout: shouldUseHorizontalLayout,
            canTogglePosition,
            textPosition: newTextPosition,
          });
          return;
        }

          if (isLowHeightDesktop && currentState.textPosition === "below") {
            newTextPosition = "right";
            canTogglePosition = false;
            
            set({
              isHorizontalLayout: shouldUseHorizontalLayout,
              canTogglePosition,
              textPosition: newTextPosition,
              userManuallyToggled: false,
            });
            return;
          }
          
          if (currentState.userManuallyToggled) {
            set({
              isHorizontalLayout: shouldUseHorizontalLayout,
              canTogglePosition,
            });
            return;
          }
          
          if (shouldUseHorizontalLayout && currentState.textPosition === "below") {
            newTextPosition = "right";
          } else if (!shouldUseHorizontalLayout && currentState.textPosition === "right") {
            newTextPosition = "below";
          }

        set({
          isHorizontalLayout: shouldUseHorizontalLayout,
          canTogglePosition,
          textPosition: newTextPosition,
        });
      },

      toggleTextVisibility: () => set((state) => ({
        showText: !state.showText,
      })),

      setTextPosition: (position) => set({
        textPosition: position,
        showText: position !== "hidden",
      }),

      toggleTextPosition: () => set((state) => {
        if (!state.canTogglePosition) return state;

        const newPosition = state.textPosition === "right" ? "below" : "right";
        
        return {
          textPosition: newPosition,
          userManuallyToggled: true,
        };
      }),
    }),
    {
      name: 'layout-store',
      partialize: (state) => ({
        // textPosition: state.textPosition,
        showText: state.showText,
        userManuallyToggled: state.userManuallyToggled,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

export default useLayoutStore;