import React, { useState } from "react";
import { Resizable } from "re-resizable";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import Middlebar from "@/components/Middlebar";
import SelectViewContainer from "@/components/SelectViewContainer";
import LayoutControlButtons from "@/components/LayoutControlButtons";
import useBibleStore from "@/store/useBibleStore";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useResizable } from "@/hooks/useResizable";
import SearchboxBCV from "@/components/SearchboxBCV";

const HomePage: React.FC = () => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const [isIntroDataAvailable, setIsIntroDataAvailable] = useState(false);
  const { shouldUseMobileBottomBar, isMobilePortrait, isMobileLandscape } =
    useDeviceDetection();

  const {
    showText,
    textPosition,
    isHorizontalLayout,
    canTogglePosition,
    toggleTextVisibility,
    toggleTextPosition,
  } = useLayoutControl();

  const shouldUseResizable = isHorizontalLayout && textPosition === "right";

  const {
    size,
    constraints,
    isResizing,
    handleResize,
    handleResizeStart,
    handleResizeStop,
  } = useResizable({
    initialWidth: isMobileLandscape ? 240 : 320,
    initialHeight: 400,
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
      if (isMobileLandscape) {
        return "flex gap-2 h-full p-2 overflow-y-auto";
      }
      return "flex flex-col h-full";
    }
    if (isHorizontalLayout && textPosition === "right") {
      return "flex gap-2 h-full p-2";
    }
    return `${textPosition === "below" ? "max-w-7xl mt-1" : ""} w-full mx-auto`;
  };

  const getVideoContainerStyle = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape) {
        return {
          flexGrow: 1,
          minWidth: 0,
        };
      }
      return {
        width: "100%",
      };
    }

    if (isHorizontalLayout && textPosition === "right") {
      return {
        flexGrow: 1,
        minWidth: 0,
        transition: showText
          ? "flex-basis 800ms ease-in-out"
          : "flex-basis 800ms ease-in-out",
      };
    }

    return {
      flexBasis: "100%",
      transition: "flex-basis 800ms ease-in-out",
      minWidth: 0,
    };
  };

  const getVerseContentClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape && showText && textPosition === "right") {
        return "verse-content-container h-full bg-gray-50 border-2 pl-4 py-2 overflow-y-auto";
      }
      if (isMobilePortrait) {
        return "verse-content-container h-full w-full bg-gray-50 border-2 pl-4 py-2";
      }
    }
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "verse-content-container h-full bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin overflow-y-auto";
    }
    const maxHeightClass =
      typeof window !== "undefined" && window.innerHeight > 1000
        ? "max-h-90"
        : "max-h-45";

    return `verse-content-container ${maxHeightClass} w-full max-w-4xl mx-auto my-2 bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin`;
  };

  const getHorizontalTextContainerClasses = () => {
    const baseClasses =
      "flex-shrink-0 transition-all duration-800 ease-in-out overflow-hidden";
    if (shouldUseMobileBottomBar && isMobileLandscape) {
      if (showText) {
        return `${baseClasses} opacity-100 overflow-y-auto`;
      } else {
        return `${baseClasses} w-0 opacity-0`;
      }
    }

    if (showText) {
      return `${baseClasses} opacity-100`;
    } else {
      return `${baseClasses} w-0 opacity-0`;
    }
  };

  const getResizableContainerStyle = () => {
    if (!showText) {
      return {
        width: 0,
        opacity: 0,
        transition: "width 800ms ease-in-out, opacity 800ms ease-in-out",
      };
    }
    return {
      opacity: 1,
      transition: "width 800ms ease-in-out, opacity 800ms ease-in-out",
    };
  };

  const getVerticalTextContainerClasses = () => {
    const baseClasses =
      "transition-all duration-800 ease-in-out overflow-hidden custom-scroll-ultra-thin";
    if (shouldUseMobileBottomBar && isMobilePortrait) {
      if (showText) {
        return `${baseClasses} h-full opacity-100`;
      } else {
        return `${baseClasses} max-h-0 opacity-0`;
      }
    }
    if (showText) {
      const maxHeightClass =
        typeof window !== "undefined" && window.innerHeight > 1000
          ? "max-h-96"
          : "max-h-48";
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

  return (
    <>
      {!shouldUseMobileBottomBar && (
        <div className="w-full bg-gray-100 mt-1">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-2 gap-1">
            <SelectBoxContainer />

            <SearchboxBCV />

            <div className="flex flex-1 flex-wrap justify-end items-center gap-2 ml-1">
              <SelectViewContainer />

              {canTogglePosition && (
                <LayoutControlButtons
                  showText={showText}
                  textPosition={textPosition}
                  canTogglePosition={canTogglePosition}
                  onToggleVisibility={toggleTextVisibility}
                  onTogglePosition={toggleTextPosition}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={`${getLayoutClasses()} ${
          isHorizontalLayout && textPosition === "right"
            ? "transition-all duration-800 ease-in-out"
            : ""
        }`}
      >
        <div
          className="transition-all duration-800 ease-in-out"
          style={getVideoContainerStyle()}
        >
          <CustomVideoPlayer />
        </div>

        {(!isHorizontalLayout || textPosition === "below") && (
          <>
            {!shouldUseMobileBottomBar && (
              <Middlebar
                showVerse={showText}
                toggleButton={toggleTextVisibility}
                isIntroDataAvailable={isIntroDataAvailable}
              />
            )}
            {shouldShowContent && (
              <div className={getVerticalTextContainerClasses()}>
                <div className={getVerseContentClasses()}>
                  <BibleVerseDisplay
                    setIsIntroDataAvailable={setIsIntroDataAvailable}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {isHorizontalLayout &&
          textPosition === "right" &&
          shouldShowContent && (
            <div
              className={getHorizontalTextContainerClasses()}
              style={
                shouldUseResizable ? getResizableContainerStyle() : undefined
              }
            >
              {shouldUseResizable ? (
                <div
                  style={{
                    transition: "opacity 800ms ease-in-out",
                    opacity: showText ? 1 : 0,
                    pointerEvents: showText ? "auto" : "none",
                  }}
                  className="flex-shrink-0 relative"
                >
                  <Resizable
                    defaultSize={{
                      width: size.width,
                      height: size.height,
                    }}
                    minWidth={constraints.minWidth}
                    maxWidth={constraints.maxWidth}
                    minHeight={constraints.minHeight}
                    maxHeight={constraints.maxHeight}
                    onResizeStart={handleResizeStart}
                    onResizeStop={(_e, _direction, ref) => {
                      console.log('Resize direction:', _direction);
                      console.log('Resize event:', _e);
                      handleResize({
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                      });
                      handleResizeStop();
                    }}
                    enable={{
                      top: true,
                      right: false,
                      bottom: true,
                      left: true,
                      topRight: false,
                      bottomRight: false,
                      bottomLeft: true,
                      topLeft: true,
                    }}
                    handleStyles={{
                      left: {
                        width: "6px",
                        background:
                          "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                        cursor: "col-resize",
                        borderRadius: "3px",
                        left: "-3px",
                      },
                      top: {
                        height: "6px",
                        background:
                          "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                        cursor: "row-resize",
                        borderRadius: "3px",
                        top: "-3px",
                      },
                      bottom: {
                        height: "6px",
                        background:
                          "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                        cursor: "row-resize",
                        borderRadius: "3px",
                        bottom: "-3px",
                      },
                      topLeft: {
                        width: "10px",
                        height: "10px",
                        background: "rgba(59, 130, 246, 0.7)",
                        borderRadius: "50%",
                        cursor: "nw-resize",
                        top: "-5px",
                        left: "-5px",
                        border: "2px solid white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      },
                      bottomLeft: {
                        width: "10px",
                        height: "10px",
                        background: "rgba(59, 130, 246, 0.7)",
                        borderRadius: "50%",
                        cursor: "sw-resize",
                        bottom: "-5px",
                        left: "-5px",
                        border: "2px solid white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      },
                    }}
                    handleClasses={{
                      left: "hover:bg-blue-400 transition-colors duration-200",
                      top: "hover:bg-blue-400 transition-colors duration-200",
                      bottom:
                        "hover:bg-blue-400 transition-colors duration-200",
                      topLeft:
                        "hover:bg-blue-500 transition-colors duration-200",
                      bottomLeft:
                        "hover:bg-blue-500 transition-colors duration-200",
                    }}
                    className="flex-shrink-0 relative"
                    style={{
                      width: `${size.width}px`,
                      ...getResizableStyle(),
                    }}
                  >
                    <div className="h-full w-full">
                      <div className={getVerseContentClasses()}>
                        <BibleVerseDisplay
                          setIsIntroDataAvailable={setIsIntroDataAvailable}
                        />
                      </div>
                    </div>
                  </Resizable>
                </div>
              ) : (
                <div
                  className={
                    shouldUseMobileBottomBar
                      ? "w-48 sm:w-60 h-full"
                      : "w-60 md:w-90 h-full"
                  }
                >
                  <div className={getVerseContentClasses()}>
                    <BibleVerseDisplay
                      setIsIntroDataAvailable={setIsIntroDataAvailable}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    </>
  );
};

export default HomePage;
