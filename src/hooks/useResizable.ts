import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useDeviceDetection from "./useDeviceDetection";

interface ResizableSize {
  width: number;
  height: number;
}

interface ResizableConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

interface UseResizableProps {
  initialWidth?: number;
  initialHeight?: number;
  isMobileLandscape?: boolean;
  persistKey?: string;
}

const isBrowser = () => typeof window !== "undefined";

export const useResizable = ({
  isMobileLandscape = false,
  persistKey = "bible-verse-container-size",
}: UseResizableProps = {}) => {
  const { deviceType, orientation, isTabletLandscape } = useDeviceDetection();

  const [viewportSize, setViewportSize] = useState(() => ({
    width: isBrowser() ? window.innerWidth : 1024,
    height: isBrowser() ? window.innerHeight : 768,
  }));

  const initialDimensions = useMemo(() => {
    const windowWidth = viewportSize.width;
    const windowHeight = viewportSize.height;

    let width: number;
    if (deviceType === "mobile" && isMobileLandscape) {
      width = windowWidth >= 640 ? 240 : 192;
    } else if (orientation === "landscape") {
      width = windowWidth >= 768 ? 360 : 240;
    } else {
      width = 360;
    }

    let height: number;
    if (deviceType === "mobile" && isMobileLandscape) {
      height = windowHeight - 80;
    } else if (orientation === "landscape" && isTabletLandscape) {
      height = windowHeight - 80;
    } else {
      height = windowHeight - 180;
    }

    return { width, height };
  }, [deviceType, isMobileLandscape, isTabletLandscape, orientation, viewportSize]);

  const getDeviceSpecificKey = useCallback(() => {
    if (!isBrowser()) return persistKey;

    const isMobile = deviceType === "mobile";
    const isTablet = deviceType === "tablet";
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile && isLandscape && isMobileLandscape) {
      return `${persistKey}-mobile-landscape`;
    } else if (isTablet && isLandscape) {
      return `${persistKey}-tablet-landscape`;
    } else {
      return `${persistKey}-large-screen`;
    }
  }, [persistKey, deviceType, isMobileLandscape]);

  const originalBodyStylesRef = useRef<{
    overflow: string;
    touchAction: string;
    userSelect: string;
  } | null>(null);

  const touchMovePreventHandler = useRef<((e: TouchEvent) => void) | null>(
    null
  );

  const constraints = useMemo((): ResizableConstraints => {
    const vw = viewportSize.width;
    const vh = viewportSize.height;
    if (isMobileLandscape) {
      return {
        minWidth: 200,
        maxWidth: Math.floor(vw * 0.45),
        minHeight: 200,
        maxHeight: vh - 50,
      };
    }
    return {
      minWidth: 280,
      maxWidth: Math.floor(vw * 0.5),
      minHeight: 300,
      maxHeight: vh - 80,
    };
  }, [viewportSize, isMobileLandscape]);

  const applyConstraints = useCallback(
    (inputSize: ResizableSize): ResizableSize => ({
      width: Math.max(
        constraints.minWidth,
        Math.min(constraints.maxWidth, inputSize.width)
      ),
      height: Math.max(
        constraints.minHeight,
        Math.min(constraints.maxHeight, inputSize.height)
      ),
    }),
    [constraints]
  );

  const getInitialSize = useCallback(() => {
    if (!isBrowser()) return initialDimensions;
    try {
      const deviceKey = getDeviceSpecificKey();
      const saved = localStorage.getItem(deviceKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedSize = {
          width: parsed.width || initialDimensions.width,
          height: parsed.height || initialDimensions.height,
        };
        return applyConstraints(savedSize);
      }
    } catch (error) {
      console.warn("Failed to load resizable size from localStorage:", error);
    }
    return applyConstraints(initialDimensions);
  }, [getDeviceSpecificKey, applyConstraints, initialDimensions]);

  const [size, setSize] = useState<ResizableSize>(() => getInitialSize());
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = useCallback(
    (newSize: ResizableSize) => {
      const constrained = applyConstraints(newSize);
      setSize(constrained);

      if (isBrowser()) {
        try {
          const deviceKey = getDeviceSpecificKey();
          localStorage.setItem(deviceKey, JSON.stringify(constrained));
        } catch (error) {
          console.warn("Failed to save resizable size to localStorage:", error);
        }
      }
    },
    [applyConstraints, getDeviceSpecificKey]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    if (!isBrowser()) return;

    // Store original body styles
    originalBodyStylesRef.current = {
      overflow: document.body.style.overflow || "",
      touchAction: document.body.style.touchAction || "",
      userSelect: document.body.style.userSelect || "",
    };

    // Apply resizing styles
    document.body.classList.add("resizing");
    document.body.style.userSelect = "none";

    // For mobile landscape, prevent scrolling and touch actions
    if (isMobileLandscape) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      touchMovePreventHandler.current = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      // Add the event listener
      document.addEventListener("touchmove", touchMovePreventHandler.current, {
        passive: false,
        capture: true,
      });

      // Also prevent touchmove on window for extra safety
      window.addEventListener("touchmove", touchMovePreventHandler.current, {
        passive: false,
        capture: true,
      });
    }
  }, [isMobileLandscape]);

  const handleResizeStop = useCallback(() => {
    setIsResizing(false);
    if (!isBrowser()) return;

    // Remove resizing class
    document.body.classList.remove("resizing");

    // Restore original body styles
    const original = originalBodyStylesRef.current;
    if (original) {
      document.body.style.overflow = original.overflow;
      document.body.style.touchAction = original.touchAction;
      document.body.style.userSelect = original.userSelect;
      originalBodyStylesRef.current = null;
    }

    // Remove touch move event listeners
    if (touchMovePreventHandler.current) {
      document.removeEventListener(
        "touchmove",
        touchMovePreventHandler.current,
        { capture: true }
      );
      window.removeEventListener("touchmove", touchMovePreventHandler.current, {
        capture: true,
      });
      touchMovePreventHandler.current = null;
    }
  }, []);

  const resetSize = useCallback(() => {
    const newSize = applyConstraints(initialDimensions);
    setSize(newSize);

    if (isBrowser()) {
      try {
        const deviceKey = getDeviceSpecificKey();
        localStorage.removeItem(deviceKey);
      } catch (error) {
        console.warn(
          "Failed to clear resizable size from localStorage:",
          error
        );
      }
    }
  }, [initialDimensions, getDeviceSpecificKey, applyConstraints]);

  useEffect(() => {
    if (!isBrowser()) return;

    const updateViewportSize = () => {
      const newViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewportSize(newViewportSize);
    };

    // Debounce viewport changes to avoid excessive updates
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewportSize, 150);
    };

    window.addEventListener("resize", debouncedUpdate);
    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;

    const handleDeviceOrConstraintChange = () => {
      try {
        const deviceKey = getDeviceSpecificKey();
        const saved = localStorage.getItem(deviceKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const savedSize = {
            width: parsed.width || initialDimensions.width,
            height: parsed.height || initialDimensions.height,
          };
          // Apply current constraints to saved size
          setSize(applyConstraints(savedSize));
        } else {
          setSize(applyConstraints(initialDimensions));
        }
      } catch (error) {
        console.warn(
          "Failed to load size after device/constraint change:",
          error
        );
        setSize(applyConstraints(initialDimensions));
      }
    };

    handleDeviceOrConstraintChange();
  }, [getDeviceSpecificKey, initialDimensions, applyConstraints]);

  useEffect(() => {
    setSize((prevSize) => {
      const constrainedSize = applyConstraints(prevSize);
      if (
        constrainedSize.width !== prevSize.width ||
        constrainedSize.height !== prevSize.height
      ) {
        if (isBrowser()) {
          try {
            const deviceKey = getDeviceSpecificKey();
            localStorage.setItem(deviceKey, JSON.stringify(constrainedSize));
          } catch (error) {
            console.warn(
              "Failed to save constrained size to localStorage:",
              error
            );
          }
        }
        return constrainedSize;
      }
      return prevSize;
    });
  }, [applyConstraints, getDeviceSpecificKey]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (touchMovePreventHandler.current) {
        document.removeEventListener(
          "touchmove",
          touchMovePreventHandler.current,
          { capture: true }
        );
        window.removeEventListener(
          "touchmove",
          touchMovePreventHandler.current,
          { capture: true }
        );
      }
    };
  }, []);

  return {
    size,
    constraints,
    isResizing,
    handleResize,
    handleResizeStart,
    handleResizeStop,
    resetSize,
    viewportSize,
  };
};