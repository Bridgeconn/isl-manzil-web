import { useEffect, useRef } from "react";
import { useDeviceDetection } from "./useDeviceDetection";
import useLayoutStore from "@/store/useLayoutStore";

export const useLayoutControl = () => {
  const {
    shouldUseHorizontalLayout,
    isTabletLandscape,
    isTabletPortrait,
    deviceType,
    isMobileLandscape,
    isMobilePortrait,
    isLowHeightDesktop
  } = useDeviceDetection();

  const {
    textPosition,
    showText,
    isHorizontalLayout,
    canTogglePosition,
    toggleTextVisibility,
    setTextPosition,
    toggleTextPosition,
    updateLayoutFromDevice,
    initializeLayout,
  } = useLayoutStore();

  const prevDeviceRef = useRef<string>(null);
  const prevLayoutRef = useRef<boolean>(null);
  const prevLowHeightRef = useRef<boolean>(null);
  const hasInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      initializeLayout({
        shouldUseHorizontalLayout,
        isTabletLandscape,
        deviceType,
        isLowHeightDesktop
      });
      hasInitialized.current = true;
      prevDeviceRef.current = deviceType;
      prevLayoutRef.current = shouldUseHorizontalLayout;
      prevLowHeightRef.current = isLowHeightDesktop;
    }
  }, [initializeLayout, shouldUseHorizontalLayout, isTabletLandscape, deviceType, isLowHeightDesktop]);

  useEffect(() => {
    if (!hasInitialized.current) return;

    const deviceChanged = prevDeviceRef.current !== deviceType;
    const layoutChanged = prevLayoutRef.current !== shouldUseHorizontalLayout;
    const lowHeightChanged = prevLowHeightRef.current !== isLowHeightDesktop;

    if (deviceChanged || layoutChanged || lowHeightChanged) {
      updateLayoutFromDevice({
        shouldUseHorizontalLayout,
        deviceType,
        isMobileLandscape,
        isMobilePortrait,
        isTabletLandscape,
        isTabletPortrait,
        isLowHeightDesktop
      });

      prevDeviceRef.current = deviceType;
      prevLayoutRef.current = shouldUseHorizontalLayout;
      prevLowHeightRef.current = isLowHeightDesktop;
    }
  }, [
    shouldUseHorizontalLayout,
    deviceType,
    isTabletLandscape,
    isTabletPortrait,
    isMobileLandscape,
    isMobilePortrait,
    updateLayoutFromDevice,
    isLowHeightDesktop
  ]);

  return {
    textPosition,
    showText,
    isHorizontalLayout,
    canTogglePosition,
    toggleTextVisibility,
    setTextPosition,
    toggleTextPosition,
  };
};