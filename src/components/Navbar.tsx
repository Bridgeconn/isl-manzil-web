import React from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings.gif";

interface NavbarProps {
  items: NavbarItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  return (
    <nav className="w-full bg-[var(--ribbon-color)] min-h-12 flex justify-between items-center">
      <div className="max-w-6xl w-full mx-auto flex flex-1 gap-8 justify-between">
        <div className="max-w-5xl w-full ml-24 flex items-center justify-start gap-8 flex-grow flex-wrap">
          {items.map((item) => (
            <div
              key={item.name}
              className="py-1 sm:py-2 cursor-pointer text-white font-bold whitespace-nowrap"
            >
              {item.name}
            </div>
          ))}
        </div>
        <div className="mr-4 h-10 flex-shrink-0">
          <img
            src={SettingGif}
            alt="Settings"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
