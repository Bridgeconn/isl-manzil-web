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
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "flex gap-2 h-full px-2";
    }
    return `${textPosition === "below" ? "max-w-6xl" : ""} w-full mx-auto`;
  };

  const getVideoContainerClasses = () => {
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "flex-1";
    }
    if (isHorizontalLayout && !showText) {
      return "w-full";
    }
    return "";
  };

  const getVerseContentClasses = () => {
    if (isHorizontalLayout && showText && textPosition === "right") {
      return "verse-content-container h-[calc(100vh-180px)] bg-gray-50 border-2 rounded-md px-4 py-2";
    }
    return "verse-content-container max-h-42 w-full sm:w-3/4 mx-auto my-2 bg-gray-50 border-2 rounded-md px-4 py-2";
  };

  return (
    <>
      <div className="w-full bg-gray-100 mt-1 mb-4 py-1">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <SelectBoxContainer />

          <div className="flex flex-1 flex-wrap justify-end items-center gap-6 ml-2">
            <SelectViewContainer />

            <LayoutControlButtons
              showText={showText}
              textPosition={textPosition}
              canTogglePosition={canTogglePosition}
              onToggleVisibility={toggleTextVisibility}
              onTogglePosition={toggleTextPosition}
            />
          </div>
        </div>
      </div>

      <div className={getLayoutClasses()}>
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
            {shouldShowContent && showText && (
              <div className={getVerseContentClasses()}>
                <BibleVerseDisplay
                  setIsIntroDataAvailable={setIsIntroDataAvailable}
                />
              </div>
            )}
          </>
        )}

        {isHorizontalLayout &&
          showText &&
          textPosition === "right" &&
          shouldShowContent && (
            <div className="w-80 flex-shrink-0">
              <div className={getVerseContentClasses()}>
                <BibleVerseDisplay
                  setIsIntroDataAvailable={setIsIntroDataAvailable}
                />
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default HomePage;
