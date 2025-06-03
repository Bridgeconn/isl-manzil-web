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
        className="bg-gray-500 flex-1"
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
        className="bg-gray-500 flex-1"
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
    <div className={`flex items-center justify-end gap-4 ${className}`}>
        <button
          onClick={onTogglePosition}
          className="flex items-center px-3 py-2  border text-white rounded-sm cursor-pointer transition-colors text-sm"
          title={
            textPosition === "right" ? "Move Text Below" : "Move Text Right"
          }
        >
          {textPosition === "right" ? (
            <CustomLayoutIcons.TextBelowIcon size={24} />
          ) : (
            <CustomLayoutIcons.TextRightIcon size={24} />
          )}
        </button>
      {textPosition === "right" && <ButtonHide isVisible={showText} toggle={onToggleVisibility} />}
    </div>
  );
};

export default LayoutControlButtons;