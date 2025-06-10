import React, { useEffect, useRef } from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings.gif";
import Settings from "./Settings";

interface NavbarProps {
  items: NavbarItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <nav className="w-full bg-[var(--ribbon-color)] min-h-12 flex justify-between items-center">
      <div className="relative max-w-7xl w-full mx-auto flex flex-1 gap-8 justify-between">
        <div className="max-w-7xl w-full ml-24 flex items-center justify-start gap-8 flex-grow flex-wrap">
          {items.map((item) => (
            <div
              key={item.name}
              className="py-1 sm:py-2 cursor-pointer text-white font-bold whitespace-nowrap"
            >
              {item.name}
            </div>
          ))}
        </div>
        <div className="mr-4 h-10 flex-shrink-0" ref={settingsRef}>
          <img
            src={SettingGif}
            alt="Settings"
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
          />
          {isSettingsOpen && (
            <div className="absolute top-full right-0 z-50">
              <Settings />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
