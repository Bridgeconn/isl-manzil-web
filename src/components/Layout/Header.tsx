import Navbar from "../Navbar";

import Logo from "../../assets/images/ISLV_Logo.svg";

const Header = () => {
  const navItems = [
    {
      name: "ISL Bible",
      path: "/"
    },
    // {
    //   name: "Dictionary",
    //   path: "/",
    // },
    // {
    //   name: "Glossary",
    //   path: "/",
    // },
    // {
    //   name: "Stories",
    //   path: "/",
    // },
    // {
    //   name: "Testimonies",
    //   path: "/",
    // },
    // {
    //   name: "Commentary",
    //   path: "/",
    // },
    // {
    //   name: "Songs",
    //   path: "/",
    // },
  ];
  return (
    <header className="w-full sticky top-0 left-0 right-0 bg-white z-50">
      {/* Header content container */}
      <div className="max-w-6xl mx-auto flex py-1 items-end relative">
        {/* Left Logo */}
        <div className="absolute left-0 top-0 z-10">
          <img
            src={Logo}
            className="w-auto h-18"
            aria-placeholder="logo"
            alt="logo"
          />
        </div>

        {/* Menu Bar */}
        <div className="flex-grow flex flex-col pl-20"> 
          <div className="w-full flex justify-between px-4 text-xs">
            <p>Bridge Connectivity Solution</p>
            <p>Indian Sign Language</p>
          </div>
        </div>
      </div>
      <Navbar items={navItems} />
    </header>
  );
};

export default Header;
