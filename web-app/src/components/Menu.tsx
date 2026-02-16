import { useNavigate , useLocation} from "react-router-dom";

export default function Menu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };
   const showBible = location.pathname !== "/HomePage";
   const showDictionary = location.pathname !== "/dictionary";
   const showProjects = location.pathname !== "/projects";
 
  return (
    <div className="absolute w-40 left-0 bg-white border border-gray-200    ">
      {showBible && (
      <div className="px-2 py-2 cursor-pointer hover:bg-gray-200 transition">
        <p onClick={() => go("/HomePage")} className="cursor-pointer ">
          Bible
        </p>
      </div>
      )}
      {showDictionary && (
      <p
        onClick={() => go("/dictionary")}
        className="px-2 py-2 cursor-pointer hover:bg-gray-200 transition "
      >
        Dictionary
      </p>
      )}
      {showProjects && (
      <p
        onClick={() => go("/projects")}
        className="px-2 py-2 cursor-pointer hover:bg-gray-200 transition "
      >
        The Bible Project
      </p>
      )}
    </div>
  );
}
