import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import SelectBoxContainer from "@/components/SelectBoxContainer";

const HomePage: React.FC = () => {
  return (
    <>
      <div className="w-full bg-gray-100 flex justify-between mt-1 mb-6 py-1 px-2">
        <SelectBoxContainer />
        <div></div>
      </div>

      <CustomVideoPlayer />
    </>
  );
};

export default HomePage;
