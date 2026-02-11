import { Plus, CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
//import VachanLogo from "@/assets/vachan-logo.png";
import { useState } from "react";

const TopBar = () => {
  const navigate = useNavigate();
  const [email] = useState("admin@vachan.com"); // temporary

  const isAdmin = true;

  return (
    <nav className="bg-[#fafafa] shadow-md">
      <div className="flex h-14 items-center justify-between px-4">
        
        {/* LEFT SIDE */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          {/* <img src={VachanLogo} alt="Logo" className="h-7 w-7" /> */}
          <h1 className="text-xl font-bold">ISL Admin</h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {isAdmin && (
            <Button
              className="bg-stone-50 text-black border hover:bg-stone-100"
            >
              Add Resource
              <Plus className="ml-2 h-4 w-4" />
            </Button>
          )}

          <CircleUserRound className="h-8 w-8 cursor-pointer" />
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
