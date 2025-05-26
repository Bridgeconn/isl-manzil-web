import useBibleStore from "@/store/useBibleStore";
import ButtonHide from "@/components/ButtonHide";
interface MiddleBarProps {
  showVerse: boolean;
  toggleButton: () => void;
}

const Middlebar = ({ showVerse, toggleButton }: MiddleBarProps) => {
  const { selectedBook, selectedChapter } = useBibleStore();
  return (
    <div className="w-full sm:w-3/4 mx-auto bg-gray-100 flex justify-start  py-2 px-4 mt-2 gap-2 items-center rounded-md">
      <ButtonHide isVisible={showVerse} toggle={toggleButton} />
      {showVerse ? (
        selectedBook && selectedChapter ? (
          <span className="text-lg font-bold">{`${selectedBook?.label} ${selectedChapter?.label}`}</span>
        ) : (
          <span className="text-lg font-bold">Loading...</span>
        )
      ) : null}
    </div>
  );
};

export default Middlebar;
