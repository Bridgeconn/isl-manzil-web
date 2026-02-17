import React, { useState } from "react";
import useThemeStore from "../store/useThemeStore";
import LayoutControlButtons from "./LayoutControlButtons";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import useDeviceDetection from "@/hooks/useDeviceDetection";
import AboutUsPopUp from "./AboutUsPopUp";
import { MdFeedback, MdInfo } from "react-icons/md";

interface SettingsProps {
  onCloseDrawer?: () => void;
}

const feedbackUrl = import.meta.env.VITE_FEEDBACK_FORM_URL;

const Settings: React.FC<SettingsProps> = ({ onCloseDrawer }) => {
  const [showAbout, setShowAbout] = useState(false);
  const {
    currentTheme,

    fontType,
    fontSize,
    setFontType,
    setFontSize,
  } = useThemeStore();
  const { textPosition, canTogglePosition, toggleTextPosition } =
    useLayoutControl();
  const { isLowHeightDesktop, shouldUseMobileBottomBar } = useDeviceDetection();
  const percent = ((fontSize - 12) * 100) / (24 - 12);

  const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      {showAbout && (
        <AboutUsPopUp
          onClose={() => setShowAbout(false)}
          showAbout={showAbout}
        />
      )}
      {!showAbout && (
        <div
          className="w-80 bg-white border border-gray-200 shadow-lg p-4 pt-2 relative themed-bg"
          onClick={handleContainerClick}
          onMouseDown={handleContainerClick}
          onTouchStart={handleContainerClick}
        >
          {/* Font Type Toggle */}
          <div>
            <h4
              className="text-base font-semibold text-gray-700 mb-3"
              style={{
                color: currentTheme?.textColor,
              }}
            >
              Font Type
            </h4>
            <div className="flex items-center gap-4 mb-2">
              <span
                className={`${
                  fontType === "serif" ? "font-bold text-black-600" : ""
                }`}
                style={{ color: currentTheme?.textColor }}
              >
                Serif
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFontType(fontType === "serif" ? "sans" : "serif");
                }}
                className="relative w-10 h-4 bg-gray-300 rounded-full focus:outline-none"
              >
                <span
                  className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    fontType === "sans" ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span
                className={`${
                  fontType === "sans" ? "font-bold text-black-600" : ""
                }`}
                style={{ color: currentTheme?.textColor }}
              >
                Sans
              </span>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="mt-4">
            <h4
              className="text-base font-semibold text-gray-700 mb-3"
              style={{ color: currentTheme?.textColor }}
            >
              Font Size
            </h4>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold text-black-600"
                style={{ color: currentTheme?.textColor }}
              >
                A-
              </span>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={fontSize}
                onChange={(e) => {
                  e.stopPropagation();
                  setFontSize(Number(e.target.value));
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full appearance-none rounded-full"
                style={{
                  height: "4px",
                  background: `linear-gradient(to right, black ${percent}%,#9ca3af ${percent}%)`,
                }}
              />

              <span
                className="text-lg font-bold text-black-600"
                style={{ color: currentTheme?.textColor }}
              >
                A+
              </span>
            </div>
          </div>
          {/* Toggle text position */}
          {!isLowHeightDesktop && !shouldUseMobileBottomBar && (
            <div className="mt-4 flex items-center gap-4">
              <h4
                className="text-base font-semibold text-gray-700"
                style={{ color: currentTheme?.textColor }}
              >
                Text position
              </h4>

              {canTogglePosition && (
                <div onClick={(e) => e.stopPropagation()}>
                  <LayoutControlButtons
                    textPosition={textPosition}
                    onTogglePosition={() => {
                      toggleTextPosition();
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <div className="mt-4">
            <div className="pt-4 border-t border-gray-200"></div>
            <div className="flex flex-row flex-wrap  items-center gap-x-18 gap-y-2">
              <div
                className="flex gap-2 items-center cursor-pointer text-base font-semibold text-gray-700 hover:text-black "
                onClick={() => {
                  setShowAbout(true);
                  onCloseDrawer?.();
                }}
                style={{ color: currentTheme?.textColor }}
              >
                <h4>About us</h4>
                <MdInfo size={18} />
              </div>

              {feedbackUrl && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (feedbackUrl) {
                      window.open(feedbackUrl, "_blank");
                    }
                  }}
                  className="flex items-center gap-2 text-base font-semibold text-gray-700 cursor-pointer hover:text-black relative"
                  style={{ color: currentTheme?.textColor }}
                >
                  <h4>Feedback</h4>
                  <MdFeedback className="mt-1" size={18} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
