import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Toaster } from "sonner";

export default function AdminLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-row flex-grow mt-1 overflow-auto">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          // style: {
          //   background: "white",
          //   border: "1px solid #e5e7eb",
          //   color: "#1f2937",
          // },
          className: "toast-custom",
        
        }}
      />
    </div>
  );
}
