import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Video,
  Languages,
  Layers,
  Hand,
  Key,
  Logs,
  ListX,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { memo, useEffect, useRef } from "react";

const Sidebar = () => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const savedScrollRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const { isAdmin } = useUserRole();

  // Prevent browser / router focus-induced auto scrolling in sidebar
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;


    const markUserScroll = () => {
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    const handleScroll = () => {
      if (isUserScrollingRef.current) {
        // user scroll → save
        savedScrollRef.current = sidebar.scrollTop;
      } else {
        // programmatic scroll → restore
        sidebar.scrollTop = savedScrollRef.current;
      }
    };

    sidebar.addEventListener("wheel", markUserScroll, { passive: true });
    sidebar.addEventListener("touchstart", markUserScroll, { passive: true });
    sidebar.addEventListener("scroll", handleScroll);

    return () => {
      sidebar.removeEventListener("wheel", markUserScroll);
      sidebar.removeEventListener("touchstart", markUserScroll);
      sidebar.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const resourceItems = [
    { to: "/bibles", label: "Bibles", icon: BookOpen },
    { to: "/isl-bible", label: "ISL Bible", icon: Hand },
    { to: "/dictionaries", label: "Dictionaries", icon: Layers },
    { to: "/videos", label: "Videos", icon: Video },
  ];

  const adminItems = [
    { to: "/languages", label: "Languages", icon: Languages },
    { to: "/versions", label: "Versions", icon: FileText },
    { to: "/licenses", label: "Licenses", icon: Key },
    { to: "/server-logs", label: "Server Logs", icon: Logs },
    { to: "/audit-logs", label: "Audit Logs", icon: Logs },
    { to: "/error-logs", label: "Error Logs", icon: ListX },
  ];

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="font-bold tracking-wide text-gray-700 uppercase px-3 mb-2 cursor-default">
      {title}
    </h3>
  );

  const NavLink = ({
    item,
  }: {
    item: { to: string; label: string; icon: any };
  }) => {
    const isActive = location.pathname === item.to;
    const Icon = item.icon;

    return (
      <Link
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm pl-6 font-medium transition-all",
          isActive
            ? "bg-sky-50 text-sky-700 shadow-sm border border-sky-200"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className="bg-white w-64 border-r border-gray-200 h-full overflow-y-auto custom-scrollbar flex flex-col shadow-sm"
    >
      <div className="py-0.5">
        {/* Resource Items */}
        <div>
          {resourceItems.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </div>

        {/* Separator */}
        {isAdmin && <div className="border-t border-gray-200 my-3" />}

        {/* Admin Items */}
        {isAdmin && (
          <div>
            <SectionHeader title="Admin Settings" />
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default memo(Sidebar);
