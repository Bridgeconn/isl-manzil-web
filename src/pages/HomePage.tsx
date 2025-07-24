import React, { useCallback, useRef, useState } from "react";
import { Resizable } from "re-resizable";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useResizable } from "@/hooks/useResizable";
import ButtonHide from "@/components/ButtonHide";
import BCVDrawer from "@/components/BCVDrawer";

const HomePage: React.FC = () => {
  const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false);
  const [isResizeHandleActive, setIsResizeHandleActive] = useState(false);
  const [showTouchHandle, setShowTouchHandle] = useState(false);

  const touchAreaRef = useRef<HTMLDivElement>(null);

  const {
    shouldUseMobileBottomBar,
    isMobilePortrait,
    isMobileLandscape,
    isTabletLandscape,
    isTabletPortrait,
    isLowHeightDesktop,
  } = useDeviceDetection();

  const { showText, textPosition, isHorizontalLayout, toggleTextVisibility } =
    useLayoutControl();

  const shouldUseResizable = isHorizontalLayout && textPosition === "right";

  const {
    size,
    constraints,
    isResizing,
    handleResize,
    handleResizeStart,
    handleResizeStop,
  } = useResizable({
    isMobileLandscape,
    persistKey: "bible-verse-container-size",
  });

  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    isMobileLandscape ||
    isTabletLandscape;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsResizeHandleActive(true);
    setShowTouchHandle(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches?.[0]) {
        const touchX = e.touches[0].clientX;
        const parent = touchAreaRef.current?.parentElement;
        const rightEdge = parent?.getBoundingClientRect()?.right ?? 0;
        const newWidth = rightEdge - touchX;

        if (
          newWidth >= constraints.minWidth &&
          newWidth <= constraints.maxWidth
        ) {
          handleResize({
            width: newWidth,
            height: size.height,
          });
        }
      }
    },
    [constraints, size.height, handleResize]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsResizeHandleActive(false);
    setShowTouchHandle(false);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizeHandleActive(true);

      const startX = e.clientX;
      const initialWidth = size.width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        const currentX = moveEvent.clientX;
        const deltaX = startX - currentX;
        const newWidth = initialWidth + deltaX;

        if (
          newWidth >= constraints.minWidth &&
          newWidth <= constraints.maxWidth
        ) {
          handleResize({
            width: newWidth,
            height: size.height,
          });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        setIsResizeHandleActive(false);
        setIsResizeHandleHovered(false);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [size.width, size.height, constraints, handleResize]
  );

  const getLayoutClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape || isTabletLandscape) {
        return "flex gap-2 h-full p-2 overflow-y-auto";
      }
      return "flex flex-col h-full";
    }
    if (
      isLowHeightDesktop ||
      (isHorizontalLayout && textPosition === "right")
    ) {
      return "flex gap-2 h-full p-2";
    }
    return `w-full mx-auto mt-1`;
  };

  const getVideoContainerStyle = () => {
    const baseStyle = {
      transition: "all 800ms ease-in-out",
      minWidth: 0,
    };
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape || isTabletLandscape) {
        return {
          ...baseStyle,
          flexGrow: 1,
        };
      }
      return {
        ...baseStyle,
        width: "100%",
      };
    }

    if (
      isLowHeightDesktop ||
      (isHorizontalLayout && textPosition === "right")
    ) {
      return {
        ...baseStyle,
        flexGrow: 1,
      };
    }

    return {
      ...baseStyle,
      flexBasis: "100%",
    };
  };

  const getVerseContentClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (
        (isMobileLandscape || isTabletLandscape) &&
        showText &&
        textPosition === "right"
      ) {
        return "themed-bg verse-content-container h-full bg-gray-50 border-2 pl-4 py-2 overflow-y-auto";
      }
      if (isMobilePortrait || isTabletPortrait) {
        return "themed-bg verse-content-container h-full w-full bg-gray-50 border-2 pl-4 py-2";
      }
    }
    const maxHeightClass =
      typeof window !== "undefined" && window.innerHeight > 1000
        ? "max-h-90 h-full"
        : "max-h-35 h-full";

    return `themed-bg verse-content-container overflow-hidden ${maxHeightClass} w-full ${
      textPosition === "below" ? "max-w-6xl" : "max-w-7xl"
    } mx-auto my-2 bg-gray-50 border-2 pl-4 py-2 custom-scroll-ultra-thin`;
  };

  const getHorizontalTextContainerClasses = () => {
    const baseClasses =
      "flex-shrink-0 h-full transition-all duration-800 ease-in-out overflow-hidden";

    return baseClasses;
  };

  const getHorizontalTextContainerStyle = () => {
    if (shouldUseResizable) {
      const widthValue = `${size?.width}px`;
      return {
        width: showText ? widthValue : 0,
        opacity: showText ? 1 : 0,
        minWidth: showText ? widthValue : 0,
        maxWidth: showText ? widthValue : 0,
        transition:
          isResizing || isResizeHandleActive ? "none" : "all 800ms ease-in-out",
      };
    }
  };

  const getVerticalTextContainerClasses = () => {
    const baseClasses =
      "transition-all duration-800 ease-in-out overflow-hidden custom-scroll-ultra-thin";
    if (shouldUseMobileBottomBar && (isMobilePortrait || isTabletPortrait)) {
      if (showText) {
        return `${baseClasses} h-full opacity-100`;
      } else {
        return `${baseClasses} max-h-0 opacity-0`;
      }
    }
    if (showText) {
      const maxHeightClass =
        typeof window !== "undefined" && window.innerHeight > 1000
          ? "max-h-96 h-full"
          : "max-h-38 h-full";
      return `${baseClasses} ${maxHeightClass} opacity-100`;
    } else {
      return `${baseClasses} max-h-0 opacity-0`;
    }
  };

  const getResizableStyle = () => {
    if (isResizing) {
      return {
        userSelect: "none" as const,
        pointerEvents: "auto" as const,
      };
    }
    return {};
  };

  const effectiveTextPosition = isLowHeightDesktop ? "right" : textPosition;

  const renderFadeWrapper = (children: React.ReactNode) => {
    return (
      <div className="relative h-full w-full">
        <div
          className={`absolute top-0 h-full z-10 pointer-events-none ${
            showText ? "fade-right" : "fade-left"
          }`}
        />
        <div
          className="h-full w-full"
          style={{
            opacity: showText ? 1 : 0,
            transition: "opacity 800ms ease-in-out",
            pointerEvents: showText ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  const getFadeCSS = () => (
    <style>{`
      .fade-left {
        background: linear-gradient(to right, white, transparent);
      }
      .fade-right {
        background: linear-gradient(to left, white, transparent);
      }
    `}</style>
  );

  const getResizeHandleStyle = () => ({
    left: "0px",
    width: "2px",
    height: "100%",
    backgroundColor:
      isResizeHandleHovered || isResizeHandleActive ? "#3b82f6" : "transparent",
    cursor: "ew-resize",
    transition: "background-color 200ms ease-in-out",
    touchAction: "none",
  });

  const getTouchAreaStyle = () => ({
    position: "absolute" as const,
    left: "0px",
    width: isTouchDevice ? "30px" : "4px",
    height: "100%",
    backgroundColor: "transparent",
    cursor: "ew-resize",
    touchAction: "none",
  });

  const renderResizeHandle = () => {
    if (!showText) return null;

    const isVisible = !isTouchDevice
      ? isResizeHandleHovered || isResizeHandleActive
      : showTouchHandle || isResizeHandleActive;

    return (
      <div
        style={{
          position: "absolute",
          left: "0px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "10px",
          height: "50px",
          cursor: "ew-resize",
          pointerEvents: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 2px",
        }}
        onMouseEnter={() => !isTouchDevice && setIsResizeHandleHovered(true)}
        onMouseLeave={() => !isTouchDevice && setIsResizeHandleHovered(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Two vertical lines as drag indicator */}
        <div
          style={{
            width: "2px",
            height: "100%",
            backgroundColor: isVisible ? "#3b82f6" : "#cbd5e1",
            borderRadius: "1px",
            transition: "background-color 200ms ease-in-out",
          }}
        />
        <div
          style={{
            width: "2px",
            height: "100%",
            backgroundColor: isVisible ? "#3b82f6" : "#cbd5e1",
            borderRadius: "1px",
            transition: "background-color 200ms ease-in-out",
          }}
        />
      </div>
    );
  };

  const renderRightSideContent = () => {
    return (
      <div
        className="themed-bg verse-content-container h-full bg-gray-50 border-2 pl-4 py-2"
        style={{ position: "relative" }}
      >
        {isTouchDevice && showText && (
          <div
            ref={touchAreaRef}
            style={getTouchAreaStyle()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* Resize handle indicator */}
        {renderResizeHandle()}

        <BibleVerseDisplay />
      </div>
    );
  };

  return (
    <>
      {getFadeCSS()}

      <div className={`${getLayoutClasses()}`}>
        <div
          className={`w-full ${
            textPosition === "below" ? "max-w-6xl" : "max-w-7xl"
          } mx-auto flex flex-col`}
          style={getVideoContainerStyle()}
        >
          {!shouldUseMobileBottomBar && (
            <div className="w-full">
              <div className="w-full flex justify-between items-center gap-4">
                <BCVDrawer />

                <ButtonHide
                  isVisible={showText}
                  toggle={toggleTextVisibility}
                />
              </div>
            </div>
          )}
          <CustomVideoPlayer />
        </div>

        {!isLowHeightDesktop &&
          (!isHorizontalLayout || effectiveTextPosition === "below") && (
            <div className={getVerticalTextContainerClasses()}>
              <div className={getVerseContentClasses()}>
                <BibleVerseDisplay />
              </div>
            </div>
          )}

        {(isLowHeightDesktop ||
          (isHorizontalLayout && effectiveTextPosition === "right")) && (
          <div
            className={getHorizontalTextContainerClasses()}
            style={{
              ...getHorizontalTextContainerStyle(),
              position: "relative",
            }}
          >
            {shouldUseResizable ? (
              <Resizable
                size={{
                  width: size?.width,
                  height: "100%",
                }}
                minWidth={constraints.minWidth}
                maxWidth={constraints.maxWidth}
                onResizeStart={() => {
                  setIsResizeHandleActive(true);
                  setShowTouchHandle(true);
                  handleResizeStart();
                }}
                onResize={(_e, _direction, ref) => {
                  handleResize({
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  });
                }}
                onResizeStop={(_e, _direction, ref) => {
                  const newSize = {
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  };

                  handleResize(newSize);
                  handleResizeStop();
                  setIsResizeHandleActive(false);
                  setIsResizeHandleHovered(false);
                  if (isTouchDevice) {
                    setShowTouchHandle(false);
                  }
                }}
                enable={{
                  left: true,
                }}
                handleComponent={{
                  left: showText ? (
                    <div
                      onMouseEnter={() => setIsResizeHandleHovered(true)}
                      onMouseLeave={() => setIsResizeHandleHovered(false)}
                      style={getResizeHandleStyle()}
                    />
                  ) : undefined,
                }}
                handleStyles={{
                  left: getResizeHandleStyle(),
                }}
                className="h-full"
                style={{
                  ...getResizableStyle(),
                  boxSizing: "border-box",
                  position: "absolute",
                  right: 0,
                  top: 0,
                  height: "100%",
                  touchAction: "none",
                }}
              >
                {renderFadeWrapper(
                  <div className="h-full w-full">
                    {renderRightSideContent()}
                  </div>
                )}
              </Resizable>
            ) : showText ? (
              renderFadeWrapper(
                <div className="h-full w-full">{renderRightSideContent()}</div>
              )
            ) : (
              renderFadeWrapper(
                <div className="h-full w-full">{renderRightSideContent()}</div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
