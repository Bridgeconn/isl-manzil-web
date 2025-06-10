import React, { useState } from "react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import Middlebar from "@/components/Middlebar";
import SelectViewContainer from "@/components/SelectViewContainer";
import LayoutControlButtons from "@/components/LayoutControlButtons";
import useBibleStore from "@/store/useBibleStore";
import { useLayoutControl } from "@/hooks/useLayoutControl";

const HomePage: React.FC = () => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const [isIntroDataAvailable, setIsIntroDataAvailable] = useState(false);

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
    if (isHorizontalLayout && textPosition === "right") {
      return "flex gap-2 h-full p-2";
    }
    return `${textPosition === "below" ? "max-w-7xl" : ""} w-full mx-auto`;
  };

  const getVideoContainerClasses = () => {
    if (isHorizontalLayout && textPosition === "right") {
      return "flex-1";
    }
    if (isHorizontalLayout && !showText) {
      return "w-full";
    }
    return "";
  };

  const getVerseContentClasses = () => {
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "verse-content-container h-[calc(100vh-180px)] bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin";
    }
    const maxHeightClass = typeof window !== 'undefined' && window.innerHeight > 1000 ? "max-h-90" : "max-h-45";
    
    return `verse-content-container ${maxHeightClass} w-full max-w-4xl mx-auto my-2 bg-gray-50 border-2 rounded-md pl-4 py-2 custom-scroll-ultra-thin`;
  };

  const getHorizontalTextContainerClasses = () => {
    const baseClasses = "flex-shrink-0 transition-all duration-800 ease-in-out overflow-hidden custom-scroll-ultra-thin";
    
    if (showText) {
      return `${baseClasses} w-60 md:w-90 opacity-100`;
    } else {
      return `${baseClasses} w-0 opacity-0`;
    }
  };

  const getVerticalTextContainerClasses = () => {
    const baseClasses = "transition-all duration-800 ease-in-out overflow-hidden custom-scroll-ultra-thin";
    
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
      <div className="w-full bg-gray-100 mt-1 mb-2">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-2">
          <SelectBoxContainer />

          <div className="flex flex-1 flex-wrap justify-end items-center gap-6 ml-2">
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

      <div className={`${getLayoutClasses()} ${isHorizontalLayout && textPosition === "right" ? "transition-all duration-800 ease-in-out" : ""}`}>
        <div className={getVideoContainerClasses()}>
          <CustomVideoPlayer />
        </div>

        {(!isHorizontalLayout || textPosition === "below") && (
          <>
            <Middlebar
              showVerse={showText}
              toggleButton={toggleTextVisibility}
              isIntroDataAvailable={isIntroDataAvailable}
            />
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
            <div className="w-60 md:w-90 h-full">
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