import BibleImg from "@/assets/bible.png";
import DictionaryImg from "@/assets/dictionary.png";
import ProjectImg from "@/assets/project.png";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white flex justify-end pr-4 pt-4 pb-4 ">

      {/* Pale blue frame */}
      <div className="bg-blue-200/20 rounded-[28px] p-4">

        <div className="flex flex-col gap-2 w-[420px]">

          {/* Tile 1 */}
          <div
            onClick={() => navigate("/HomePage")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl">
              <img
                src={BibleImg}
                alt="Bible"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2 text-blue-900 font-semibold text-xl">
              Bible
            </p>
          </div>

          {/* Tile 2 */}
          <div
            onClick={() => navigate("/dictionary")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl">

              <img
                src={DictionaryImg}
                alt="Dictionary"
                className="w-full rounded-xl"
              />
            </div>
            <p className="mt-2 text-blue-900 font-semibold text-xl">
              Dictionary
            </p>
          </div>

          {/* Tile 3 */}
          <div
            onClick={() => navigate("/projects")}
            className="text-center cursor-pointer"
          >
            <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl">

              <img
                src={ProjectImg}
                alt="The Bible Projects"
                className="w-full rounded-xl"
              />
            </div>
            <p className="mt-2 text-blue-900 font-semibold text-xl">
              The Bible Projects
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Landing;
