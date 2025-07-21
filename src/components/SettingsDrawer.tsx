import React from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import PlaybackButton from "./PlaybackButton";

interface SettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  selectedQuality: string;
  onOpenQualityDrawer: () => void;
  onOpenPlaybackDrawer: () => void;
  playbackSpeed: number;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isVisible,
  onClose,
  selectedQuality,
  onOpenQualityDrawer,
  onOpenPlaybackDrawer,
  playbackSpeed,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-10 md:bottom-12 right-4 bg-black bg-opacity-90 text-white rounded-lg shadow-lg w-45 md:w-48 p-3 z-50 themed-bg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold themed-text">Settings</span>
        <button onClick={onClose} className="text-white themed-text">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* Speed Row */}
        <div
          onClick={onOpenPlaybackDrawer}
          className="flex justify-between items-center cursor-pointer hover:bg-gray-400 py-2 px-1 rounded"
        >
          <div className="flex items-center gap-2 themed-text">
            <PlaybackButton />
            <span className="text-white text-sm font-medium leading-none themed-text">
              Speed
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-300 leading-none themed-text">
            <span className="ml-2">
              {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
            </span>
            <ChevronRight
              strokeWidth={2.5}
              className="w-5 h-5 sm:w-6 sm:h-6 text-white themed-text"
            />
          </div>
        </div>

        {/* Quality Row */}
        <div
          className="flex justify-between items-center cursor-pointer hover:bg-gray-400 py-2 px-1 rounded"
          onClick={onOpenQualityDrawer}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              strokeWidth={2.5}
              className="w-5 h-5 sm:w-6 sm:h-6 text-white themed-text"
            />
            <span className="text-white text-sm font-medium leading-none themed-text">
              Quality
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-400 leading-none themed-text">
            <span className="ml-3.5">
              {selectedQuality.toLowerCase() === "auto"
                ? "Auto"
                : selectedQuality}
            </span>
            <ChevronRight
              strokeWidth={2.5}
              className="w-5 h-5 sm:w-6 sm:h-6 text-white themed-text"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
