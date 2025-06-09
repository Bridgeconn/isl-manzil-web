import React from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '../../assets/images/ISLV_Logo.svg';
import useBibleStore from "@/store/useBibleStore";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";

interface MobileBottomBarProps {
  className?: string;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ className = '' }) => {
  const { selectedBook, selectedChapter } = useBibleStore();
  const {canGoPrevious, canGoNext, navigateToChapter } = useChapterNavigation();
  return (
    <div className={`bg-white border-t-2 border-gray-200 px-4 py-2 flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        <img
            src={Logo}
            className="w-auto h-16"
            aria-placeholder="logo"
            alt="logo"
          />
      </div>

      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
        <button className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-colors" title='Previous Chapter'>
          {canGoPrevious && <ChevronLeft size={20} onClick={() => navigateToChapter("previous")}/>}
        </button>
        <span className="text-sm font-medium text-gray-700 px-2">
          {selectedBook?.label ?? "Book"} {selectedChapter?.label ?? "Chapter"}
        </span>
        <button className="p-1 text-gray-600 hover:text-[var(--indigo-color)] transition-colors" title='Next Chapter'>
          {canGoNext && <ChevronRight size={20} onClick={() => navigateToChapter("next")}/>}
        </button>
      </div>

      <button className="p-2 text-gray-600 hover:text-[var(--indigo-color)] transition-colors">
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileBottomBar;