import React, { useState } from "react";
import { Resizable } from "re-resizable";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import SelectViewContainer from "@/components/SelectViewContainer";
import useBibleStore from "@/store/useBibleStore";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useResizable } from "@/hooks/useResizable";
import ButtonHide from "@/components/ButtonHide";
import BCVDrawer from "@/components/BCVDrawer";

const HomePage: React.FC = () => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const [isIntroDataAvailable, setIsIntroDataAvailable] = useState(false);
  const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false);
  const [isResizeHandleActive, setIsResizeHandleActive] = useState(false);
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

  const shouldShowContent = !(
    selectedBook &&
    selectedChapter?.value === 0 &&
    !isIntroDataAvailable
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
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape || isTabletLandscape) {
        return {
          flexGrow: 1,
          minWidth: 0,
        };
      }
      return {
        width: "100%",
      };
    }

    if (
      isLowHeightDesktop ||
      (isHorizontalLayout && textPosition === "right")
    ) {
      return {
        flexGrow: 1,
        minWidth: 0.
      };
    }

    return {
      flexBasis: "100%",
      minWidth: 0,
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

    return `themed-bg verse-content-container ${maxHeightClass} w-full ${textPosition === "below" ? "max-w-6xl" : "max-w-7xl"} mx-auto my-2 bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin`;
  };

  const getHorizontalTextContainerClasses = () => {
    const baseClasses =
      "flex-shrink-0 h-full transition-all duration-800 ease-in-out overflow-hidden";

    if (shouldUseMobileBottomBar && (isMobileLandscape || isTabletLandscape)) {
      return baseClasses + " overflow-y-auto";
    }

    return baseClasses;
  };

  const getHorizontalTextContainerStyle = () => {
    if (shouldUseResizable) {
      const widthValue = `${size?.width}px`;
      return {
        width: widthValue,
        opacity: 1,
        minWidth: widthValue,
        maxWidth: widthValue,
        transition: isResizing ? "none" : "all 500ms ease-in-out",
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
    width: `${isMobileLandscape || isTabletLandscape ? "4px" : "2px"}`,
    height: "100%",
    backgroundColor:
      isResizeHandleHovered || isResizeHandleActive ? "#3b82f6" : "transparent",
    cursor: "ew-resize",
    zIndex: 20,
    transition: "background-color 200ms ease-in-out",
    borderLeft:
      isResizeHandleHovered || isResizeHandleActive
        ? "2px solid #3b82f6"
        : "2px solid transparent",
    touchAction: "none",
  });

  return (
    <>
      {getFadeCSS()}

      <div className={`${getLayoutClasses()}`}>
        <div
          className={`w-full ${textPosition === "below" ? "max-w-6xl" : "max-w-7xl"} mx-auto flex flex-col`}
          style={getVideoContainerStyle()}
        >
          {!shouldUseMobileBottomBar && (
            <div className="w-full mb-2">
              <div className="w-full flex justify-between items-center gap-4">
                {/* <SelectBoxContainer /> */}
                <BCVDrawer />

                <div className="ml-auto">
                  <SelectViewContainer />
                </div>
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
          (!isHorizontalLayout || effectiveTextPosition === "below") &&
          shouldShowContent && (
            <div className={getVerticalTextContainerClasses()}>
              <div className={getVerseContentClasses()}>
                <BibleVerseDisplay
                  setIsIntroDataAvailable={setIsIntroDataAvailable}
                />
              </div>
            </div>
          )}

        {(isLowHeightDesktop ||
          (isHorizontalLayout && effectiveTextPosition === "right")) &&
          shouldShowContent && (
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
                    height: '100%',
                  }}
                  minWidth={constraints.minWidth}
                  maxWidth={constraints.maxWidth}
                  onResizeStart={() => {
                    setIsResizeHandleActive(true);
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
                  }}
                  enable={{
                    left: true,
                  }}
                  handleComponent={{
                    left: (
                      <div
                        onMouseEnter={() => setIsResizeHandleHovered(true)}
                        onMouseLeave={() => setIsResizeHandleHovered(false)}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          setIsResizeHandleActive(true);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          setIsResizeHandleActive(false);
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault();
                          if (e.touches?.[0]) {
                            const touchX = e.touches[0].clientX;
                            const parent =
                              e.currentTarget.parentElement?.parentElement;
                            const rightEdge =
                              parent?.getBoundingClientRect()?.right ?? 0;
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
                        }}
                        style={getResizeHandleStyle()}
                      />
                    ),
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
                      <div className="themed-bg verse-content-container h-full bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin overflow-y-auto">
                        <BibleVerseDisplay
                          setIsIntroDataAvailable={setIsIntroDataAvailable}
                        />
                      </div>
                    </div>
                  )}
                </Resizable>
              ) : showText ? (
                renderFadeWrapper(
                  <div className="h-full w-full">
                    <div className="themed-bg verse-content-container h-full bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin overflow-y-auto">
                      <BibleVerseDisplay
                        setIsIntroDataAvailable={setIsIntroDataAvailable}
                      />
                    </div>
                  </div>
                )
              ) : null}
            </div>
          )}
      </div>
    </>
  );
};

export default HomePage;
