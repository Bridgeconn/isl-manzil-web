import React from "react";

const SearchboxTooltip: React.FC = () => {
  return (
    <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 shadow-md rounded-md p-3 text-xs z-50 w-[220px]">
      <h2 className=" text-lg mb-2">Search Hints</h2>

      <div className="mb-2">
        <h2 className="font-semibold text-lg">Chapter Search</h2>
        <p className="text-gray-700 text-base">
          Eg: <span>gen 49 or genesis 49</span>
        </p>
      </div>

      <div className="mb-2">
        <p className="font-semibold text-lg">Verse Search</p>
        <p className="text-gray-700 text-base">
          Eg: <span>genesis 12:2</span>
        </p>
      </div>
    </div>
  );
};

export default SearchboxTooltip;
