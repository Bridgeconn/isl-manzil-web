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

  const toggleAbout = () => setIsAboutOpen(!isAboutOpen);
  const closeAbout = () => setIsAboutOpen(false);

  return (
    <div className="bg-white w-full flex flex-col md:flex-row md:h-full md:overflow-hidden">
      {/* VIDEO SECTION — hidden below 768px */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-4 min-w-0 min-h-0 overflow-hidden">
        <div className="w-full flex justify-end mb-1 flex-shrink-0">
          <ButtonHide
            isVisible={isAboutOpen}
            toggle={toggleAbout}
            alwaysShowImage={true}
            size="w-10 h-10 lg:w-14 lg:h-14"
          />
        </div>
        <div className="w-full flex-1 min-h-0 overflow-hidden flex items-center">
          <div
            className="w-full  mt-2"
            style={{ maxHeight: "100%", aspectRatio: "16/9" }}
          >
            <CleanVimeoPlayer videoId={1105756880} />
            {isAboutOpen && (
              <div>
                {" "}
                {/* <div className="absolute top-20 left-s0 z-[9999]"> <div className=" max-h-[90vh] overflow-hidden bg-white rounded shadow-xl"> */}{" "}
                <AboutUsPopUp
                  showAbout={isAboutOpen}
                  onClose={closeAbout}
                  hideVideoSection={true}
                  closeImage={HideTextImage}
                />{" "}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TILES SIDEBAR */}
      <div
        className="
        flex-shrink-0
        w-full py-4 px-4
        md:w-[200px] md:h-full md:py-3 md:px-2 md:overflow-hidden
        lg:w-[240px] lg:px-3 lg:py-3
        xl:w-[290px] xl:px-4 xl:py-4
        2xl:w-[330px]
      "
      >
        <div
          className="
            w-full rounded-3xl shadow-md flex flex-col
            gap-4 p-4
            md:h-full md:p-3 md:gap-2
            lg:p-4 lg:gap-3
            xl:p-5 xl:gap-4
          "
          style={{ backgroundColor: "rgba(215, 229, 240, 0.6)" }}
        >
          {/* Tile 1 — Bible */}
          <div
            onClick={() => navigate("/HomePage")}
            className="text-center cursor-pointer group
              flex flex-col
              md:flex-1 md:min-h-0"
          >
            <div
              className="
              overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition
              md:flex-1 md:min-h-0
            "
            >
              <img
                src={BibleImg}
                alt="Bible"
                className="w-full block
                  h-full
                  md:h-full md:object-fill"
              />
            </div>
            <p
              className="text-black font-semibold mt-1 flex-shrink-0
              text-sm md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base"
            >
              Bible
            </p>
          </div>

          {/* Tile 2 — Dictionary */}
          <div
            onClick={() => navigate("/dictionary")}
            className="text-center cursor-pointer group
              flex flex-col
              md:flex-1 md:min-h-0"
          >
            <div
              className="
              overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition
              md:flex-1 md:min-h-0
            "
            >
              <img
                src={DictionaryImg}
                alt="Dictionary"
                className="w-full block
                  h-full
                  md:h-full md:object-fill"
              />
            </div>
            <p
              className="text-black font-semibold mt-1 flex-shrink-0
              text-sm md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base"
            >
              Dictionary
            </p>
          </div>

          {/* Tile 3 — The Bible Project */}
          <div
            onClick={() => navigate("/projects")}
            className="text-center cursor-pointer group
              flex flex-col
              md:flex-1 md:min-h-0"
          >
            <div
              className="
              overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition
              md:flex-1 md:min-h-0
            "
            >
              <img
                src={ProjectImg}
                alt="The Bible Projects"
                className="w-full block
                  h-full
                  md:h-full md:object-fill"
              />
            </div>
            <p
              className="text-black font-semibold mt-1 flex-shrink-0
              text-sm md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base"
            >
              The Bible Project
            </p>
          </div>
        </div>
      </div>

      {/* ABOUT US POPUP — md and above only */}
    </div>
  );
};
export default Landing;
