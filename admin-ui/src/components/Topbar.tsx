import React, { useEffect, useState } from "react";
import { LogOut, Plus, CircleUserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Session from "supertokens-web-js/recipe/session";
import { useAddResource } from "@/hooks/useAPI";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import AddResourceDialog from "@/components/AddResourceDialog";

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const addResourceMutation = useAddResource();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const fetchEmailFromStorage = () => {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    };

    setTimeout(() => {
      fetchEmailFromStorage();
    }, 100);
  }, []);

  const handleLogout = async () => {
    await Session.signOut();
    localStorage.removeItem("userEmail");
    setEmail("");
    navigate("/auth");
  };

  const handleAddResource = async (resourceData: any) => {
    try {
      await addResourceMutation.mutateAsync(resourceData);
      toast.success("Resource added successfully!");
      setIsAddResourceDialogOpen(false);
    } catch (error) {
      console.error("Add resource error:", error);

      throw error;
    }
  };

  return (
    <>
      <nav className="bg-[#fafafa]">
        <div className="flex h-14 items-center justify-between px-4 shadow-md">
          <div className="flex flex-1 items-center">
            <button
              className="flex items-center gap-2"
              onClick={() => navigate("/")}
            >
              {/* <img src={VachanLogo} alt="Logo" className="h-7 w-7" /> */}
              <h1 className="text-xl font-bold">ISL Admin</h1>
            </button>
          </div>

          {/* Right section - Add Resource, Add Resources and Profile buttons */}
          <div className="flex items-center gap-4">
            {/* Add Resource Button */}
            {isAdmin && (
              <Button
                // variant="outline"
                className="bg-stone-50 text-black border hover:bg-stone-100 hover:border-stone-200"
                onClick={() => setIsAddResourceDialogOpen(true)}
              >
                Add Resource
                <Plus className="h-4 w-4 mt-0.5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-lg flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                  aria-label="Toggle User Menu"
                >
                  <CircleUserRound className="h-8 w-8" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* TODO: In future, we can ask for username from signup form to show */}
                {/* {userData && userData.username && (
                  <>
                    <DropdownMenuLabel>
                      <span className="text-[.7rem] font-medium uppercase p-1">
                        SIGNED IN AS
                        <strong>{" " + userData.username.toUpperCase()}</strong>
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )} */}

                {email && (
                  <DropdownMenuItem
                    title={email}
                    className="cursor-default text-xs font-medium text-gray-900 hover:bg-transparent block truncate"
                  >
                    {email}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      {isAdmin && (
        <AddResourceDialog
          isOpen={isAddResourceDialogOpen}
          onClose={() => setIsAddResourceDialogOpen(false)}
          onSubmit={handleAddResource}
          mode="add"
        />
      )}
    </>
  );
};

export default TopBar;
