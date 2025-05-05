import React from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings-1.gif";

interface NavbarProps {
  items: NavbarItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  return (
    <nav className="w-full bg-[var(--ribbon-color)] min-h-12 flex justify-between items-center">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-start gap-8 flex-grow flex-wrap px-10">
        {items.map((item) => (
          <div
            key={item.name}
            className="py-1 sm:py-2 cursor-pointer text-white font-bold whitespace-nowrap"
          >
            {item.name}
          </div>
        ))}
        </div>
      </div>
      <div className="ml-4 pr-4">
        <img src={SettingGif} alt="Settings" className="h-12 w-auto" />
      </div>
    </nav>
  );
};

export default Navbar;
