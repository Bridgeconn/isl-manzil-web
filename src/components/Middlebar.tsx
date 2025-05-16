import useBibleStore from "@/store/useBibleStore";

const Middlebar = () => {
  const { selectedBook, selectedChapter } = useBibleStore();
  return (
    <div className="w-full sm:w-3/4 mx-auto bg-gray-100 flex justify-start py-2 px-4 mt-2 rounded-md">
      <span className="text-lg font-bold">{`${selectedBook?.label} ${
        selectedChapter?.label
      }`}</span>
    </div>
  );
};

export default Middlebar;
