import React from "react";
import HideImage from "../assets/images/Hide_Verse_cropped.gif";
import ShowImage from "../assets/images/Show_Verse_cropped.gif";

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
        className="w-20 h-10 flex items-center justify-center gap-2 px-2 py-1 border-2 text-black rounded-md cursor-pointer"
      >
        {buttonImage && (
          <img src={buttonImage} alt="show/hide" className="w-10 h-9" />
        )}
      </button>
    </div>
  );
};

export default ButtonHide;
