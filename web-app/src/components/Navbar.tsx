import React, { useEffect, useRef } from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings.gif";
import Settings from "./Settings";
import SearchboxBCV from "./SearchboxBCV";
import { MenuIcon } from "lucide-react";
import Menu from "./Menu";

import Logo from "../assets/images/ISLV_Logo.svg";

interface NavbarProps {
  items: NavbarItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest('[role="dialog"]')) {
        // setIsSettingsOpen(false)
        return;
      }
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isSettingsOpen || isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen, isMenuOpen]);

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
    <nav className="relative w-full bg-[#000063] min-h-14 flex  items-center">
      {/* <div className="relative w-full mx-auto flex flex-1 gap-8 justify-between"> */}
      <div className="w-full  flex items-center relative">
        <div className="ml-4 cursor-pointer text-white" ref={menuButtonRef}>
          <MenuIcon
            strokeWidth={2.5}
            size={28}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          />
        </div>

        {/* Left Logo */}
        <div className="ml-4 z-10 h-12 w-12 bg-white rounded-full p-1 overflow-hidden">
          <img
            src={Logo}
            className=" w-auto h-auto "
            aria-placeholder="logo"
            alt="logo"
          />
        </div>

        <div className="flex items-center ml-4 text-white">
          {items.map((item) => (
            <div
              key={item.name}
              className="py-1 sm:py-2 cursor-pointer font-bold whitespace-nowrap"
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
      {/* <div className="flex items-center justify-between gap-8 flex-1"> */}
      <div className="absolute  left-1/2 transform -translate-x-1/2">
        <SearchboxBCV />
      </div>
      <div
        className="mr-10 h-12 w-12 bg-white rounded-full flex-shrink-0"
        ref={settingsRef}
      >
        <img
          src={SettingGif}
          alt="Settings"
          className="w-auto h-auto object-contain cursor-pointer"
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
      <div className="absolute w-full mt-10 left-0 z-50">
        {isMenuOpen && (
          <div ref={menuRef}>
            <Menu />
          </div>
        )}
      </div>

      {/* </div> */}
    </nav>
  );
};

export default Navbar;
