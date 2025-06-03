import { useState, useEffect, useCallback } from "react";

export type DeviceType = "mobile" | "tablet" | "laptop" | "desktop";
export type Orientation = "portrait" | "landscape";
export type LayoutMode = "vertical" | "horizontal";

interface ScreenInfo {
  deviceType: DeviceType;
  orientation: Orientation;
  layoutMode: LayoutMode;
  width: number;
  height: number;
  isTabletLandscape: boolean;
  shouldUseHorizontalLayout: boolean;
}

export const useDeviceDetection = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() =>
    getScreenType()
  );

  const updateScreenInfo = useCallback(() => {
    setScreenInfo(getScreenType());
  }, []);

  useEffect(() => {
    const handleResize = () => updateScreenInfo();
    const handleOrientationChange = () => {
      setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateScreenInfo]);

  return screenInfo;
};

const getScreenType = (): ScreenInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  let deviceType: DeviceType;
  if (width < 640) {
    deviceType = "mobile";
  } else if (width >= 640 && width < 1024) {
    deviceType = "tablet";
  } else if (width >= 1024 && width < 1440) {
    deviceType = "laptop";
  } else {
    deviceType = "desktop";
  }

  const orientation: Orientation = width > height ? "landscape" : "portrait";
  const isTabletLandscape = deviceType === "tablet" && orientation === "landscape";
  
  const shouldUseHorizontalLayout = () => {
    const isLandscape = width > height;
    const isShortScreen = height <= 800;
    

    return isLandscape || isShortScreen;
  };

  const layoutMode: LayoutMode = shouldUseHorizontalLayout() ? "horizontal" : "vertical";

  return {
    width,
    height,
    deviceType,
    orientation,
    layoutMode,
    isTabletLandscape,
    shouldUseHorizontalLayout: shouldUseHorizontalLayout(),
  };
};

export default useDeviceDetection;
