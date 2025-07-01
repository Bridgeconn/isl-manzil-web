import React from "react";
import HideImage from "../assets/images/Hide_Verse_cropped.gif";
import ShowImage from "../assets/images/Show_Verse_cropped.gif";

import HoverControlledGif from "./HoverControlledGif";

interface ButtonHideProps {
  isVisible: boolean;
  toggle: () => void;
  shouldShowContent: boolean;
}

const ButtonHide: React.FC<ButtonHideProps> = ({
  isVisible,
  toggle,
  shouldShowContent,
}) => {
  const buttonImage = isVisible ? HideImage : ShowImage;
  return (
    <div>
      {shouldShowContent ? (
        <button
          onClick={toggle}
          title={`${isVisible ? "Hide Text" : "Show Text"}`}
        >
          <HoverControlledGif
            src={buttonImage}
            alt="show/hide"
            className="w-20 h-14 object-contain cursor-pointer"
            duration={3000}
            loopCount={Infinity}
          />
        </button>
      ) : (
        <button className="invisible">
          <HoverControlledGif
            src={buttonImage}
            alt="show/hide"
            className="w-20 h-14 object-contain cursor-pointer"
          />
        </button>
      )}
    </div>
  );
};

export default ButtonHide;
