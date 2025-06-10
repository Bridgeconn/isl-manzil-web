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
  isMobileLandscape: boolean;
  isMobilePortrait: boolean;
  shouldUseHorizontalLayout: boolean;
  shouldUseMobileBottomBar: boolean;
}

// Enhanced device detection
const detectTrueDeviceType = (): DeviceType => {
  const ua = navigator.userAgent.toLowerCase();
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const pixelRatio = window.devicePixelRatio || 1;

  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const maxDim = Math.max(currentWidth, currentHeight);
  const minDim = Math.min(currentWidth, currentHeight);

  if (/iphone/.test(ua)) {
    return "mobile";
  }

  const hasUserAgentData = (
    nav: Navigator
  ): nav is Navigator & { userAgentData: { mobile: boolean } } => {
    return (
      "userAgentData" in nav &&
      typeof (nav as any).userAgentData.mobile === "boolean"
    );
  };

  const mobileUA = hasUserAgentData(navigator)
    ? navigator.userAgentData.mobile
    : /android.*mobile|iphone|windows phone/.test(ua);

  const isDesktopEmulatingMobile =
    mobileUA &&
    maxTouchPoints === 0 &&
    pixelRatio <= 1.25 &&
    maxDim > 900;

  if (isDesktopEmulatingMobile) {
    return "laptop"; // fallback for emulated mobile on desktop
  }

  const tabletPatterns = [
    /ipad/,
    /android(?!.*mobile)/,
    /tablet/,
    /kindle/,
    /silk/,
    /playbook/,
  ];

  for (const pattern of tabletPatterns) {
    if (pattern.test(ua)) return "tablet";
  }

  if (hasTouch) {
    const dpi = pixelRatio * 96;
    const physicalDiagonal = Math.sqrt(
      Math.pow(maxDim / dpi, 2) + Math.pow(minDim / dpi, 2)
    );

    // Fallback if physicalDiagonal not reliable
    if (!physicalDiagonal || physicalDiagonal <= 0) {
      if (maxDim <= 900) return "mobile";
      if (maxDim >= 768 && maxDim <= 1366) return "tablet";
    }

    if (
      maxDim <= 926 &&
      (minDim <= 428 || physicalDiagonal < 7 || pixelRatio >= 2)
    ) {
      return "mobile";
    }

    if (maxDim >= 768 && maxDim <= 1366 && physicalDiagonal >= 7) {
      return "tablet";
    }

    if (maxDim > 1366) {
      return physicalDiagonal > 15 ? "desktop" : "laptop";
    }
  }

  // Fallback for non-touch devices
  if (maxDim >= 1920) return "desktop";
  if (maxDim >= 1024) return "laptop";
  if (maxDim >= 768) return "tablet";

  return "mobile";
};

const getScreenType = (): ScreenInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const deviceType = detectTrueDeviceType();
  const orientation: Orientation = width > height ? "landscape" : "portrait";

  const isTabletLandscape =
    deviceType === "tablet" && orientation === "landscape";
  const isMobileLandscape =
    deviceType === "mobile" && orientation === "landscape";
  const isMobilePortrait =
    deviceType === "mobile" && orientation === "portrait";

  const shouldUseHorizontalLayout = (): boolean => {
    if (deviceType === "mobile") {
      return isMobileLandscape;
    }
    return orientation === "landscape";
  };

  const layoutMode: LayoutMode = shouldUseHorizontalLayout()
    ? "horizontal"
    : "vertical";
  const shouldUseMobileBottomBar = deviceType === "mobile";

  return {
    width,
    height,
    deviceType,
    orientation,
    layoutMode,
    isTabletLandscape,
    isMobileLandscape,
    isMobilePortrait,
    shouldUseHorizontalLayout: shouldUseHorizontalLayout(),
    shouldUseMobileBottomBar,
  };
};

export const useDeviceDetection = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() =>
    getScreenType()
  );

  const updateScreenInfo = useCallback(() => {
    setScreenInfo(getScreenType());
  }, []);

  useEffect(() => {
    const handleResize = () => updateScreenInfo();
    const handleOrientationChange = () => setTimeout(updateScreenInfo, 100);

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    if (screen?.orientation) {
      screen.orientation.addEventListener("change", handleOrientationChange);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);

      if (screen?.orientation) {
        screen.orientation.removeEventListener(
          "change",
          handleOrientationChange
        );
      }
    };
  }, [updateScreenInfo]);

  return screenInfo;
};

export default useDeviceDetection;
