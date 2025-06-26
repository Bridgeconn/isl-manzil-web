import { useState } from "react";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import useBibleStore from "@/store/useBibleStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BCVDrawer = () => {
  const { selectedBook, selectedChapter, selectedVerse } = useBibleStore();
  const { canGoPrevious, canGoNext, navigateToChapter } =
    useChapterNavigation();
  const [isBCVDrawerOpen, setIsBCVDrawerOpen] = useState(false);

  return (
    <div
      className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-md px-3 py-2"
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.2) 0px 4px 6px -1px," +
          "rgba(0, 0, 0, 0.14) 0px 2px 4px 0px," +
          "rgba(0, 0, 0, 0.12) 0px -1px 4px 0px",
        transition: "box-shadow 0.3s ease-in-out",
      }}
    >
      <button
        className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105"
        title="Previous Chapter"
      >
        {canGoPrevious && (
          <ChevronLeft
            size={20}
            onClick={() => navigateToChapter("previous")}
          />
        )}
      </button>
      <span
        className="text-sm font-medium text-gray-700 px-2 cursor-pointer"
        onClick={() => setIsBCVDrawerOpen(true)}
      >
        {selectedBook?.label ?? "Book"} {selectedChapter?.label ?? "Chapter"} :{" "}
        {selectedVerse?.label ?? "Verse"}
      </span>
      <button
        className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105"
        title="Next Chapter"
      >
        {canGoNext && (
          <ChevronRight size={20} onClick={() => navigateToChapter("next")} />
        )}
      </button>
    </div>
  );
};

export default BCVDrawer;
