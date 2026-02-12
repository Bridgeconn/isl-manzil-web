import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();
  return (
    <div className="absolute left-0 bg-white border border-gray-300 p-4 rounded-md  ">
      <p onClick={() => navigate("/HomePage")} className="cursor-pointer py-2">
        Bible
      </p>
      <p
        onClick={() => navigate("/dictionary")}
        className="cursor-pointer py-2"
      >
        Dictionary
      </p>
      <p
        onClick={() => navigate("/bibleprojects")}
        className="cursor-pointer py-2"
      >
        The Bible Project
      </p>
    </div>
  );
}
