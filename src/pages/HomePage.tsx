import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";
import BibleVerseDisplay from "@/components/BibleVerseDisplay";
import Middlebar from "@/components/Middlebar";
import SelectViewContainer from "@/components/SelectViewContainer";

import { useState } from "react";

const HomePage: React.FC = () => {
  const [showVerse, setShowVerse] = useState(true);

  const toggleButton = () => {
    setShowVerse(!showVerse);
  };

  return (
    <>
      <div className="w-full bg-gray-100 flex justify-between mt-1 mb-6 py-1 px-2">
        <SelectBoxContainer />
        <SelectViewContainer />
      </div>
      <div>
        <CustomVideoPlayer />
      </div>

      <Middlebar showVerse={showVerse} toggleButton={toggleButton} />
      {showVerse && (
        <div className="verse-content-container min-h-34 w-full sm:w-3/4 mx-auto my-2 bg-gray-50 border-2 rounded-md px-4 py-2">
          <BibleVerseDisplay />
        </div>
      )}
    </>
  );
};

export default HomePage;
