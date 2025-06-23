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
          transition: "all 800ms ease-in-out",
        };
      }
      return {
        width: "100%",
        transition: "all 800ms ease-in-out",
      };
    }

    if (isHorizontalLayout && textPosition === "right") {
      return {
        flexGrow: 1,
        minWidth: 0,
        transition: "all 800ms ease-in-out",
      };
    }

    return {
      flexBasis: "100%",
      transition: "all 800ms ease-in-out",
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
    const baseClasses = "flex-shrink-0 h-full transition-all duration-800 ease-in-out overflow-hidden";
    
    if (shouldUseMobileBottomBar && isMobileLandscape) {
      return baseClasses + "overflow-y-auto";
    }

    return baseClasses;
  };

  const getHorizontalTextContainerStyle = () => {
    if (!showText) {
      return {
        width: 0,
        opacity: 0,
        minWidth: 0,
        maxWidth: 0,
        transition: 'all 800ms ease-in-out',
      };
    }
    
    if (shouldUseResizable) {
      return {
        width: `${size?.width}px`,
        opacity: 1,
        minWidth: `${size?.width}px`,
        maxWidth: `${size?.width}px`,
        transition: isResizing ? 'none' : 'all 800ms ease-in-out',
      };
    }
    
    const defaultWidth = shouldUseMobileBottomBar 
      ? (isMobileLandscape ? "20rem" : "15rem")
      : "30rem";
    
    return {
      width: defaultWidth,
      opacity: 1,
      minWidth: defaultWidth,
      maxWidth: defaultWidth,
      transition: 'all 800ms ease-in-out',
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
        className={`${getLayoutClasses()}`}
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
              style={getHorizontalTextContainerStyle()}
            >
              {shouldUseResizable && showText ? (
                <Resizable
                  size={{
                    width: size?.width,
                    height: size?.height,
                  }}
                  minWidth={constraints.minWidth}
                  maxWidth={constraints.maxWidth}
                  minHeight={constraints.minHeight}
                  maxHeight={constraints.maxHeight}
                  onResizeStart={handleResizeStart}
                  onResize={(_e, _direction, ref) => {
                    const newWidth = ref.offsetWidth;
                    
                    const parentContainer = ref.parentElement;
                    if (parentContainer) {
                      parentContainer.style.width = `${newWidth}px`;
                      parentContainer.style.minWidth = `${newWidth}px`;
                      parentContainer.style.maxWidth = `${newWidth}px`;
                      
                      parentContainer.style.transition = 'none';
                    }
                  }}
                  onResizeStop={(_e, _direction, ref) => {
                    const newSize = {
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                    };
                    
                    const parentContainer = ref.parentElement;
                    if (parentContainer) {
                      parentContainer.style.transition = 'all 800ms ease-in-out';
                    }
                    
                    handleResize(newSize);
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
                  className="h-full"
                  style={{
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
              ) : showText ? (
                <div className="h-full w-full">
                  <div className={getVerseContentClasses()}>
                    <BibleVerseDisplay
                      setIsIntroDataAvailable={setIsIntroDataAvailable}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
      </div>
    </>
  );
};

export default HomePage;