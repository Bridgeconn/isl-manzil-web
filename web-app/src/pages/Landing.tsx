import BibleImg from "@/assets/images/bible.png";
import DictionaryImg from "@/assets/images/dictionary.png";
import ProjectImg from "@/assets/images/project.png";
import { useNavigate } from "react-router-dom";

import { useState } from "react";
import ButtonHide from "../components/ButtonHide";
import AboutUsPopUp from "@/components/AboutUsPopUp";
import HideTextImage from "@/assets/images/Hide_Verse_cropped.gif";
import CleanVimeoPlayer from "@/components/CleanVimeoPlayer";

const Landing = () => {
  const navigate = useNavigate();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const toggleAbout = () => {
    setIsAboutOpen(!isAboutOpen);
  };
  const closeAbout = () => setIsAboutOpen(false);
  return (
    <div className="bg-white h-screen flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 px-4 lg:px-6 py-4 lg:py-0 overflow-hidden">
      {/* Video Section */}

      <div className="w-full  lg:w-[80%] xl:w-[100%] flex items-center justify-center">
        <div className="aspect-video w-full  max-w-[1100px] max-h-[50vh] lg:max-h-[85vh]">
          <div className="ml-220">
            <ButtonHide
              isVisible={isAboutOpen}
              toggle={toggleAbout}
              alwaysShowImage={true}
              size="w-16 h-16"
            />
          </div>
          <CleanVimeoPlayer videoId={1105756880} />
        </div>
      </div>

      {/* Tiles Section */}
      <div className="w-full h-[87vh] lg:w-[200px] xl:w-[340px] bg-[#d7e5f0] rounded-3xl p-4 lg:p-6 shadow-md overflow-hidden">
        <div className="flex flex-row lg:flex-col gap-4 lg:gap-6 justify-between">
          {/* Tile 1 */}
          <div
            onClick={() => navigate("/HomePage")}
            className="text-center cursor-pointer group flex-1"
          >
            <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition">
              <img
                src={BibleImg}
                alt="Bible"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-black font-semibold text-base lg:text-lg">
              Bible
            </p>
          </div>

          {/* Tile 2 */}
          <div
            onClick={() => navigate("/dictionary")}
            className="text-center cursor-pointer group flex-1"
          >
            <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition">
              <img
                src={DictionaryImg}
                alt="Dictionary"
                className="w-full h-full object-cover"
              />
            </div>
            <p className=" text-black font-semibold text-base lg:text-lg">
              Dictionary
            </p>
          </div>

          {/* Tile 3 */}
          <div
            onClick={() => navigate("/projects")}
            className="text-center cursor-pointer group flex-1"
          >
            <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition">
              <img
                src={ProjectImg}
                alt="The Bible Projects"
                className="w-full h-full object-cover"
              />
            </div>
            <p className=" text-black font-semibold text-base lg:text-lg">
              The Bible Project
            </p>
          </div>
        </div>
      </div>
      <AboutUsPopUp
        showAbout={isAboutOpen}
        onClose={closeAbout}
        hideVideoSection={true}
        closeImage={HideTextImage}
      />
    </div>
  );
};
export default Landing;
