import BibleImg from "@/assets/bible.png";
import DictionaryImg from "@/assets/dictionary.png";
import ProjectImg from "@/assets/project.png";
import { useNavigate } from "react-router-dom";
import CleanVimeoPlayer from "@/components/CleanVimeoPlayer";


const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white flex gap-6 pr-4 pt-4 pb-4">

      {/* Pale blue frame */}
      <div className="flex-[1.4] mt-18 flex justify-center">
        <div className="aspect-video w-full">
          <CleanVimeoPlayer videoId={1105756880} />
        </div>
      </div>
      <div className="bg-gray-500/30 rounded-[28px] p-4">

        <div className="flex flex-col gap-2 w-[360px] mx-auto">

          {/* Tile 1 */}
          <div
            onClick={() => navigate("/HomePage")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/10] overflow-hidden rounded-4xl">
              <img
                src={BibleImg}
                alt="Bible"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2 text-black font-semibold text-xl">
              Bible
            </p>
          </div>

          {/* Tile 2 */}
          <div
            onClick={() => navigate("/dictionary")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/10] overflow-hidden rounded-4xl">

              <img
                src={DictionaryImg}
                alt="Dictionary"
                className="w-full h-full object-cover "
              />
            </div>
            <p className="mt-2 text-black font-semibold text-xl">
              Dictionary
            </p>
          </div>

          {/* Tile 3 */}
          <div
            onClick={() => navigate("/projects")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/10] overflow-hidden rounded-4xl">

              <img
                src={ProjectImg}
                alt="The Bible Projects"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2 text-black font-semibold text-xl">
              The Bible Projects
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Landing;
