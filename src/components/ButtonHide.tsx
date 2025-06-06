import React from "react";
import HideImage from "../assets/images/Hide_Verse_cropped.gif";
import ShowImage from "../assets/images/Show_Verse_cropped.gif";

interface ButtonHideProps {
  isVisible: boolean;
  toggle: () => void;
}

const ButtonHide: React.FC<ButtonHideProps> = ({ isVisible, toggle }) => {
  const buttonText = isVisible ? "Hide Text" : "Show Text";
  const buttonImage = isVisible ? HideImage : ShowImage;
  return (
    <div>
      <button
        onClick={toggle}
        className="w-35 flex items-center gap-2 px-2 py-1 border-2 text-black rounded-md cursor-pointer"
      >
        {buttonImage && (
          <img src={buttonImage} alt="show/hide" className="w-9 h-9" />
        )}
        <span className="themed-text">{buttonText}</span>
      </button>
    </div>
  );
};

export default ButtonHide;
