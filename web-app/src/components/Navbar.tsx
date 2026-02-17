import React, { useEffect, useRef } from "react";
import { NavbarItem } from "../types/Navigation";
import SettingGif from "../assets/images/settings.gif";
import Settings from "./Settings";
import SearchboxBCV from "./SearchboxBCV";
import { MenuIcon } from "lucide-react";
import Menu from "./Menu";
import { useLocation } from "react-router-dom";
import Logo from "../assets/images/ISLV_Logo.svg";
import { Link } from "react-router-dom";

interface NavbarProps {
  items: NavbarItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest('[role="dialog"]')) {
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
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  return (
    <nav className="relative w-full bg-[#000063] min-h-16 flex  items-center">
      <div className="w-full  flex items-center relative">
        <div className="ml-4  cursor-pointer text-white" ref={menuButtonRef}>
          <button type="button" title="Menu" className="cursor-pointer">
            <MenuIcon
              strokeWidth={2.5}
              size={30}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            />
          </button>
          <div className="absolute w-full h-auto shadow-md mt-4 left-0 ">
            {isMenuOpen && (
              <div ref={menuRef}>
                <Menu onClose={() => setIsMenuOpen(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Left Logo */}
        <Link to="/" className="ml-4 flex items-center gap-4">
          <div className=" z-10 h-14 w-14 bg-white rounded-full p-1 overflow-hidden">
            <img
              src={Logo}
              className=" w-auto h-auto "
              aria-placeholder="logo"
              alt="logo"
            />
          </div>

          {items.map((item) => (
            <div
              key={item.name}
              className="py-1 sm:py-2 cursor-pointer font-bold whitespace-nowrap text-white"
            >
              {item.name}
            </div>
          ))}
        </Link>
      </div>
      {!isLandingPage && (
        <div className="absolute  left-1/2 transform -translate-x-1/2">
          <SearchboxBCV />
        </div>
      )}
      <div
        className=" h-14 w-14 bg-white rounded-full flex-shrink-0"
        ref={settingsRef}
      >
        <img
          src={SettingGif}
          title="Settings"
          alt="Settings"
          className="w-auto h-auto object-contain cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen((prev) => !prev);
          }}
        />
        {isSettingsOpen && (
          <div className="absolute top-full right-0 z-50 ">
            <Settings />
          </div>
        )}
      </div>

      {/* </div> */}
    </nav>
  );
};

export default Navbar;
