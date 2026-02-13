import BibleImg from "@/assets/bible.png";
import DictionaryImg from "@/assets/dictionary.png";
import ProjectImg from "@/assets/project.png";
import { useNavigate } from "react-router-dom";
import CleanVimeoPlayer from "@/components/CleanVimeoPlayer";

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white h-screen flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 px-4 lg:px-6 py-4 lg:py-0 overflow-hidden">
      
      {/* Video Section */}
      <div className="flex-1 w-full lg:w-auto flex items-center justify-center">
        <div className="aspect-video w-full max-h-[50vh] lg:max-h-[85vh]">
          <CleanVimeoPlayer videoId={1105756880} />
        </div>
      </div>

      {/* Tiles Section */}
      <div className="w-full lg:w-[300px] xl:w-[400px] bg-gray-500/30 rounded-3xl p-4 lg:p-6 shadow-md overflow-hidden">
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
            <p className="mt-2 lg:mt-3 text-black font-semibold text-base lg:text-lg">
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
            <p className="mt-2 lg:mt-3 text-black font-semibold text-base lg:text-lg">
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
            <p className="mt-2 lg:mt-3 text-black font-semibold text-base lg:text-lg">
              The Bible Projects
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Landing;