import React from "react";
import { TextPosition } from "@/hooks/useLayoutControl";
import ButtonHide from "./ButtonHide";

interface IconProps {
  size?: number;
  className?: string;
}

const CustomLayoutIcons = {
  // Vertical layout icon
  TextBelowIcon: ({ size = 20, className = "" }: IconProps) => (
    <div 
      className={`inline-flex flex-col ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="border-1  bg-white flex-1"
        style={{ borderRadius: '2px' }}
      />
      <div 
        className="bg-black flex-1"
        style={{ borderRadius: '2px' }}
      />
    </div>
  ),

  // Horizontal layout icon
  TextRightIcon: ({ size = 20, className = "" }: IconProps) => (
    <div 
      className={`inline-flex ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="border-1 bg-white flex-1"
        style={{ borderRadius: '2px' }}
      />
      <div 
        className="bg-black flex-1"
        style={{ borderRadius: '2px' }}
      />
    </div>
  ),
};

interface LayoutControlButtonsProps {
  showText: boolean;
  textPosition: TextPosition;
  canTogglePosition: boolean;
  onToggleVisibility: () => void;
  onTogglePosition: () => void;
  className?: string;
}

const LayoutControlButtons: React.FC<LayoutControlButtonsProps> = ({
  showText,
  textPosition,
  onToggleVisibility,
  onTogglePosition,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      {/* Text Right Button */}
      <button
        onClick={onTogglePosition}
        className={`flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-all duration-200 ${
          textPosition === "right" 
            ? "shadow-lg shadow-blue-500/50" 
            : "hover:shadow-md hover:shadow-gray-400/30"
        }`}
        title="Move Text Right"
        disabled={textPosition === "right"}
      >
        <CustomLayoutIcons.TextRightIcon size={16} />
      </button>

      {/* Text Below Button */}
      <button
        onClick={onTogglePosition}
        className={`flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-all duration-200 ${
          textPosition === "below" 
            ? "shadow-lg shadow-blue-500/50" 
            : "hover:shadow-md hover:shadow-gray-400/30"
        }`}
        title="Move Text Below"
        disabled={textPosition === "below"}
      >
        <CustomLayoutIcons.TextBelowIcon size={16} />
      </button>

      <div className={`${textPosition === "right" ? "visible" : "invisible"}`}>
        <ButtonHide isVisible={showText} toggle={onToggleVisibility} />
      </div>
    </div>
  );
};

export default LayoutControlButtons;