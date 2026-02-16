import React from "react";
import HideImage from "../assets/images/Hide_Verse_cropped.gif";
import ShowImage from "../assets/images/Show_Verse_cropped.gif";

import HoverControlledGif from "./HoverControlledGif";

interface ButtonHideProps {
  isVisible: boolean;
  toggle: () => void;
  alwaysShowImage?: boolean;
  size?: string;
}

const ButtonHide: React.FC<ButtonHideProps> = ({
  isVisible,
  toggle,
  alwaysShowImage = false,
  size,
}) => {
  const buttonImage = alwaysShowImage
    ? ShowImage
    : isVisible
      ? HideImage
      : ShowImage;
  return (
    <div>
      <button
        onClick={toggle}
        title={`${
          alwaysShowImage
            ? "Show AboutUs"
            : isVisible
              ? "Hide Text"
              : "Show Text"
        }`}
      >
        <HoverControlledGif
          src={buttonImage}
          alt="show/hide"
          className={`${size ?? "w-20"}   object-contain cursor-pointer`}
          duration={3000}
          loopCount={Infinity}
        />
      </button>
    </div>
  );
};

export default ButtonHide;
