import Navbar from "../Navbar";

import Logo from "../../assets/images/ISLV_Logo.svg";

const Header = () => {
  const navItems = [
    {
      name: "ISLV Bible",
      path: "/",
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
    <header
      className="max-w-screen w-full px-6 sticky top-0 left-0 right-0 z-10 bg-white
      shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)]
      transition-shadow duration-300 ease-out
    "
    >
      {/* Header content container */}
      <div className="w-full flex items-center relative">
        {/* Left Logo */}
        <div className="absolute left-0 top-0 z-10">
          <img
            src={Logo}
            className="w-auto h-14"
            aria-placeholder="logo"
            alt="logo"
          />
        </div>
      </div>
      <Navbar items={navItems} />
    </header>
  );
};

export default Header;
