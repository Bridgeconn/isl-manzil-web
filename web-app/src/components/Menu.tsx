import { useNavigate , useLocation} from "react-router-dom";

export default function Menu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };
  const isBible = location.pathname === "/HomePage";
  const isDictionary = location.pathname === "/dictionary";
  const isProjects = location.pathname === "/projects";

  return (
    <div className="absolute w-40 left-0 bg-white border border-gray-200">
  
      {/* Bible */}
      <div
        onClick={() => !isBible && go("/HomePage")}
        className={`px-2 py-2 transition ${
          isBible
            ? "text-gray-400 cursor-not-allowed bg-gray-50"
            : "cursor-pointer hover:bg-gray-200"
        }`}
      >
        Bible
      </div>
  
      {/* Dictionary */}
      <div
        onClick={() => !isDictionary && go("/dictionary")}
        className={`px-2 py-2 transition ${
          isDictionary
            ? "text-gray-400 cursor-not-allowed bg-gray-50"
            : "cursor-pointer hover:bg-gray-200"
        }`}
      >
        Dictionary
      </div>
  
      {/* Projects */}
      <div
        onClick={() => !isProjects && go("/projects")}
        className={`px-2 py-2 transition ${
          isProjects
            ? "text-gray-400 cursor-not-allowed bg-gray-50"
            : "cursor-pointer hover:bg-gray-200"
        }`}
      >
        The Bible Project
      </div>
  
    </div>
  );
}  