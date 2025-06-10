import React, { useState } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "../../assets/images/ISLV_Logo.svg";
import useBibleStore from "@/store/useBibleStore";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import MobileBookDrawer from "../MobileBookDrawer";

interface MobileBottomBarProps {
  className?: string;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  className = "",
}) => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const { canGoPrevious, canGoNext, navigateToChapter } =
    useChapterNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={`z-50
      backdrop-blur-md bg-white/90
      shadow-[0_-4px_20px_rgba(0,0,0,0.15),0_-4px_20px_rgba(0,0,0,0.08),0_-1px_4px_rgba(0,0,0,0.04)]
      border-t border-white/50
      px-4 flex items-center justify-between
      before:absolute before:inset-0 before:-z-10 before:rounded-t-2xl
      before:bg-gradient-to-b before:from-white/80 before:via-white/40 before:to-white/10
      after:absolute after:inset-x-0 after:top-0 after:-z-10 after:h-px
      after:bg-gradient-to-r after:from-transparent after:via-white/90 after:to-transparent
      ${className}
    `}
      >
        <div className="flex items-center">
          <img
            src={Logo}
            className="w-auto h-12"
            aria-placeholder="logo"
            alt="logo"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200/60 ring-1 ring-white/50">
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
            className="text-sm font-medium text-gray-700 px-2"
            onClick={() => setIsDrawerOpen(true)}
          >
            {selectedBook?.label ?? "Book"}{" "}
            {selectedChapter?.label ?? "Chapter"}
          </span>
          <button
            className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105"
            title="Next Chapter"
          >
            {canGoNext && (
              <ChevronRight
                size={20}
                onClick={() => navigateToChapter("next")}
              />
            )}
          </button>
        </div>

        <button className="p-2 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105 rounded-lg hover:bg-gray-100/50">
          <Menu size={24} />
        </button>
      </div>
      <MobileBookDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};

export default MobileBottomBar;
