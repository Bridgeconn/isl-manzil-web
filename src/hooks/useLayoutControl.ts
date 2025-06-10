import { useState, useEffect } from "react";
import { useDeviceDetection } from "./useDeviceDetection";

export type TextPosition = "below" | "right" | "hidden";

interface LayoutControlState {
  textPosition: TextPosition;
  showText: boolean;
  isHorizontalLayout: boolean;
  canTogglePosition: boolean;
}

export const useLayoutControl = () => {
  const {
    shouldUseHorizontalLayout,
    isTabletLandscape,
    deviceType,
    isMobileLandscape,
    isMobilePortrait,
  } = useDeviceDetection();

  const [layoutState, setLayoutState] = useState<LayoutControlState>(() => ({
    textPosition:
      shouldUseHorizontalLayout || isTabletLandscape ? "right" : "below",
    showText: true,
    isHorizontalLayout: shouldUseHorizontalLayout,
    canTogglePosition: shouldUseHorizontalLayout && deviceType !== "mobile",
  }));

  useEffect(() => {
    setLayoutState((prev) => {
      let newTextPosition = prev.textPosition;
      let canTogglePosition =
        shouldUseHorizontalLayout && deviceType !== "mobile";

      if (deviceType === "mobile") {
        if (isMobileLandscape) {
          newTextPosition = "right";
        } else if (isMobilePortrait) {
          newTextPosition = "below";
        }
        canTogglePosition = false;
      } else {
        if (shouldUseHorizontalLayout) {
          if (prev.textPosition === "below" && prev.showText) {
            newTextPosition = "right";
          }
        } else {
          if (prev.textPosition === "right") {
            newTextPosition = "below";
          }
        }
      }

      return {
        ...prev,
        isHorizontalLayout: shouldUseHorizontalLayout,
        canTogglePosition,
        textPosition: newTextPosition,
      };
    });
  }, [
    shouldUseHorizontalLayout,
    deviceType,
    isMobileLandscape,
    isMobilePortrait,
  ]);

  const toggleTextVisibility = () => {
    setLayoutState((prev) => ({
      ...prev,
      showText: !prev.showText,
    }));
  };

  const setTextPosition = (position: TextPosition) => {
    setLayoutState((prev) => ({
      ...prev,
      textPosition: position,
      showText: position !== "hidden",
    }));
  };

  const toggleTextPosition = () => {
    setLayoutState((prev) => {
      if (!prev.canTogglePosition) return prev;

      const newPosition = prev.textPosition === "right" ? "below" : "right";
      return {
        ...prev,
        textPosition: newPosition,
      };
    });
  };

  return {
    ...layoutState,
    toggleTextVisibility,
    setTextPosition,
    toggleTextPosition,
  };
};
