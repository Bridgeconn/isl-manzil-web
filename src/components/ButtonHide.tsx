import React from "react";
import HideImage from "../assets/images/Hide verse .gif";

interface ButtonHideProps {
  isVisible: boolean;
  toggle: () => void;
}

const ButtonHide: React.FC<ButtonHideProps> = ({ isVisible, toggle }) => {
  const buttonText = isVisible ? "Hide Text" : "Show Text";
  const buttonImage = isVisible ? HideImage : "";
  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-4 border-2 text-black rounded-md cursor-pointer"
      >
        {buttonImage ? (
          <img src={buttonImage} alt="show/hide" className="w-10 h-10" />
        ) : (
          <div className="w-10 h-10"></div>
        )}
        <span>{buttonText}</span>
      </button>
    </div>
  );
};

export default ButtonHide;
