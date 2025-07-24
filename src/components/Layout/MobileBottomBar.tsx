import React, { useEffect, useRef, useState } from "react";
import { Menu, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import Logo from "../../assets/images/ISLV_Logo.svg";
import useBibleStore from "@/store/useBibleStore";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import MobileBookDrawer from "../MobileBookDrawer";
import MobileMenuDrawer from "../MobileMenuDrawer";
import useThemeStore from "@/store/useThemeStore";
import BibleBookImg from "../../assets/images/bibleIcon.png";

interface MobileBottomBarProps {
  className?: string;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  className = "",
}) => {
  const { currentTheme } = useThemeStore();
  const { selectedBook, selectedChapter } = useBibleStore();
  const { canGoPrevious, canGoNext, navigateToChapter } =
    useChapterNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        isMenuDrawerOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(target)
      ) {
        setIsMenuDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuDrawerOpen]);

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isDrawerOpen || isMenuDrawerOpen ? "z-40" : "z-[999]"
        } h-16
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

        <div
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200/60 ring-1 ring-white/50"
          onClick={() => setIsDrawerOpen(true)}
          style={{
            backgroundColor: currentTheme?.id === "theme3" ? "white" : "",
            minHeight: "40px"
          }}
        >
          <button
            className={`px-1 border-r border-gray-200 text-gray-600 hover:text-[var(--indigo-color)]
            `}
            title="Previous Chapter"
            style={{ borderRight: "1px solid #ccc" }}
          >
            {canGoPrevious ? (
              <ChevronLeft
                size={20}
                strokeWidth={2}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToChapter("previous");
                }}
              />
            ) : selectedBook?.label === "Genesis" ? (
              <img
                src={BibleBookImg}
                alt="bible"
                className="w-8 h-4 object-contain"
              />
            ) : null}
          </button>
          <span
            className="text-sm font-medium flex items-center justify-center gap-1 text-gray-700 px-2 cursor-pointer"
            style={{
              color:
                currentTheme?.id === "theme3"
                  ? currentTheme?.backgroundColor
                  : currentTheme?.textColor,
            }}
          >
            {selectedBook?.label ? (
              <>
                {selectedBook?.label}{" "}
                {selectedChapter?.label === "0"
                  ? "Intro"
                  : selectedChapter?.label ?? "Chapter"}
              <ChevronDown size={16} strokeWidth={2} className="mt-0.5" />
              </>
            ) : (
              <>Loading...</>
            )}
          </span>
          <button
            className="px-1 border-l border-gray-200 text-gray-600 hover:text-[var(--indigo-color)]"
            title="Next Chapter"
            style={{ borderLeft: "1px solid #ccc" }}
          >
            {canGoNext && (
              <ChevronRight
                size={20}
                strokeWidth={2}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToChapter("next");
                }}
              />
            )}
          </button>
        </div>

        <button
          ref={settingsButtonRef}
          className="p-2 text-gray-600 hover:text-[var(--indigo-color)] transition-all duration-200 hover:scale-105 rounded-lg hover:bg-gray-100/50"
          onClick={() => setIsMenuDrawerOpen((prev) => !prev)}
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="h-16"></div>

      <MobileBookDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      <MobileMenuDrawer
        open={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
      />
    </>
  );
};

export default MobileBottomBar;
