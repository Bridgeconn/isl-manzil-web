import React, { useState } from "react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import Middlebar from "@/components/Middlebar";
import SelectViewContainer from "@/components/SelectViewContainer";
import LayoutControlButtons from "@/components/LayoutControlButtons";
import useBibleStore from "@/store/useBibleStore";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const HomePage: React.FC = () => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const [isIntroDataAvailable, setIsIntroDataAvailable] = useState(false);
  const { 
    shouldUseMobileBottomBar, 
    isMobilePortrait, 
    isMobileLandscape 
  } = useDeviceDetection();

  const {
    showText,
    textPosition,
    isHorizontalLayout,
    canTogglePosition,
    toggleTextVisibility,
    toggleTextPosition,
  } = useLayoutControl();

  const shouldShowContent = !(
    selectedBook &&
    selectedChapter?.value === 0 &&
    !isIntroDataAvailable
  );

  const getLayoutClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape) {
        return "flex gap-2 h-full px-2";
      }
      return "flex flex-col h-full";
    }
    if (isHorizontalLayout && textPosition === "right") {
      return "flex gap-2 h-full px-2";
    }
    return `${textPosition === "below" ? "max-w-6xl" : ""} w-full mx-auto`;
  };

  const getVideoContainerClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape) {
        return "flex-1";
      }
      return "w-full";
    }
    if (isHorizontalLayout && textPosition === "right") {
      return "flex-1";
    }
    if (isHorizontalLayout && !showText) {
      return "w-full";
    }
    return "";
  };

  const getVerseContentClasses = () => {
    if (shouldUseMobileBottomBar) {
      if (isMobileLandscape && showText && textPosition === "right") {
        return "verse-content-container h-[calc(100vh-100px)] bg-gray-50 border-2 px-4 py-2";
      }
      if (isMobilePortrait) {
        return "verse-content-container h-full w-full bg-gray-50 border-2 px-4 py-2";
      }
    }
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "verse-content-container h-[calc(100vh-180px)] bg-gray-50 border-2 px-4 py-2";
    }
    const maxHeightClass = typeof window !== 'undefined' && window.innerHeight > 1000 ? "max-h-90" : "max-h-45";
    
    return `verse-content-container ${maxHeightClass} w-full sm:w-3/4 mx-auto my-2 bg-gray-50 border-2 px-4 py-2`;
  };

  const getHorizontalTextContainerClasses = () => {
    const baseClasses = "flex-shrink-0 transition-all duration-800 ease-in-out overflow-hidden";
    if (shouldUseMobileBottomBar && isMobileLandscape) {
      if (showText) {
        return `${baseClasses} w-auto opacity-100`;
      } else {
        return `${baseClasses} w-0 opacity-0`;
      }
    }
    
    if (showText) {
      return `${baseClasses} w-60 md:w-80 opacity-100`;
    } else {
      return `${baseClasses} w-0 opacity-0`;
    }
  };

  const getVerticalTextContainerClasses = () => {
    const baseClasses = "transition-all duration-800 ease-in-out overflow-hidden";
    if (shouldUseMobileBottomBar && isMobilePortrait) {
      if (showText) {
        return `${baseClasses} h-full opacity-100`;
      } else {
        return `${baseClasses} max-h-0 opacity-0`;
      }
    }
    if (showText) {
      // Dynamic max-height based on viewport height
      const maxHeightClass = typeof window !== 'undefined' && window.innerHeight > 1000 ? "max-h-96" : "max-h-48";
      return `${baseClasses} ${maxHeightClass} opacity-100`;
    } else {
      return `${baseClasses} max-h-0 opacity-0`;
    }
  };

  return (
    <>
    {!shouldUseMobileBottomBar && (
      <div className="w-full bg-gray-100 mt-1 mb-4 py-1">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <SelectBoxContainer />

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

      <div className={`${getLayoutClasses()} ${isHorizontalLayout && textPosition === "right" ? "transition-all duration-800 ease-in-out" : ""}`}>
        <div className={getVideoContainerClasses()}>
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

        {isHorizontalLayout && textPosition === "right" && shouldShowContent && (
          <div className={getHorizontalTextContainerClasses()}>
            <div className={shouldUseMobileBottomBar ? "w-48 sm:w-60 h-full" : "w-60 md:w-80 h-full"}>
              <div className={getVerseContentClasses()}>
                <BibleVerseDisplay
                  setIsIntroDataAvailable={setIsIntroDataAvailable}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;