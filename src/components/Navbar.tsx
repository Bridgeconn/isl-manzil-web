import React, { useEffect, useRef } from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings.gif";
import Settings from "./Settings";
import SearchboxBCV from "./SearchboxBCV";

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

  useEffect(() => {
    if (isSettingsOpen) {
      document.body.classList.add("settings-open");
    } else {
      document.body.classList.remove("settings-open");
    }

    return () => {
      document.body.classList.remove("settings-open");
    };
  }, [isSettingsOpen]);

  return (
    <nav className="w-full bg-white min-h-14 flex justify-between items-center">
      <div className="relative w-full mx-auto flex flex-1 gap-8 justify-between">
        <div className="max-w-8xl w-full ml-20 flex items-center justify-start gap-8 flex-grow flex-wrap">
          {items.map((item) => (
            <div
              key={item.name}
              className="py-1 sm:py-2 cursor-pointer font-bold whitespace-nowrap"
            >
              {item.name}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-8 flex-1">
        <SearchboxBCV />
        <div className="h-14 w-18 flex-shrink-0" ref={settingsRef}>
          <img
            src={SettingGif}
            alt="Settings"
            className="w-full h-full object-contain cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen((prev) => !prev);
            }}
          />
          {isSettingsOpen && (
            <div className="absolute top-full right-0 z-50">
              <Settings />
            </div>
          )}
        </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
