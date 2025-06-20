import React from "react";
import HideImage from "../assets/images/Hide_Verse_cropped.gif";
import ShowImage from "../assets/images/Show_Verse_cropped.gif";

import HoverControlledGif from "./HoverControlledGif";

interface ButtonHideProps {
  isVisible: boolean;
  toggle: () => void;
}

const ButtonHide: React.FC<ButtonHideProps> = ({ isVisible, toggle }) => {
  const buttonImage = isVisible ? HideImage : ShowImage;
  return (
    <div>
      <button
        onClick={toggle}
        className="w-20 h-12 flex items-center justify-center gap-2 px-2 py-1 border-2 text-black rounded-md cursor-pointer"
      >
        <HoverControlledGif
          src={buttonImage}
          alt="show/hide"
          className="w-12 h-12"
          duration={3000}
          loopCount={Infinity}
        />
      </button>
    </div>
  );
};

export default ButtonHide;
