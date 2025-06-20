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
  initialWidth = 320,
  initialHeight = 400,
  isMobileLandscape = false,
  persistKey = "bible-verse-container-size",
}: UseResizableProps = {}) => {
  const { deviceType } = useDeviceDetection();

  // Get device-specific storage key
  const getDeviceSpecificKey = useCallback(() => {
    if (!isBrowser()) return persistKey;

    const isMobile = deviceType === "mobile";
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile && isLandscape && isMobileLandscape) {
      return `${persistKey}-mobile-landscape`;
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

  const [size, setSize] = useState<ResizableSize>(() => {
    if (!isBrowser()) return { width: initialWidth, height: initialHeight };
    try {
      const deviceKey = getDeviceSpecificKey();
      const saved = localStorage.getItem(deviceKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: parsed.width || initialWidth,
          height: parsed.height || initialHeight,
        };
      }
    } catch (error) {
      console.warn("Failed to load resizable size from localStorage:", error);
    }
    return { width: initialWidth, height: initialHeight };
  });
  const [isResizing, setIsResizing] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: isBrowser() ? window.innerWidth : 1024,
    height: isBrowser() ? window.innerHeight : 768,
  }));

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
      maxHeight: vh - 120,
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
    const newSize = { width: initialWidth, height: initialHeight };
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
  }, [initialWidth, initialHeight, getDeviceSpecificKey]);

  useEffect(() => {
    if (!isBrowser()) return;

    const updateViewportSize = () => {
      const newViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewportSize(newViewportSize);

      // When viewport changes significantly (device rotation or resize), reset size
      const deviceKey = getDeviceSpecificKey();
      try {
        const saved = localStorage.getItem(deviceKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const savedSize = {
            width: parsed.width || initialWidth,
            height: parsed.height || initialHeight,
          };
          setSize(applyConstraints(savedSize));
        } else {
          // No saved size for this device type, use defaults
          setSize(
            applyConstraints({ width: initialWidth, height: initialHeight })
          );
        }
      } catch (error) {
        console.warn("Failed to load size after viewport change:", error);
        setSize(
          applyConstraints({ width: initialWidth, height: initialHeight })
        );
      }
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
  }, [getDeviceSpecificKey, initialWidth, initialHeight, applyConstraints]);

  useEffect(() => {
    setSize((prev) => applyConstraints(prev));
  }, [applyConstraints]);

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
