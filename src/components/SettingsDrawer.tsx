import React from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import PlaybackButton from "./PlaybackButton";

interface SettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  selectedQuality: string;
  onOpenQualityDrawer: () => void;
  onOpenPlaybackDrawer: () => void; // NEW
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
    <div
      className="absolute bottom-10 md:bottom-12 right-4 bg-black bg-opacity-90 text-white rounded-lg shadow-lg w-45 md:w-48 p-3 z-50"
      style={{}}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">Settings</span>
        <button onClick={onClose} className="text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div
          onClick={onOpenPlaybackDrawer}
          className="flex items-center gap-2 justify-between cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          <PlaybackButton />
          <span className="text-white text-sm font-medium leading-none">
            Speed
          </span>
          <span className="text-gray-300 text-sm ml-2 leading-none">
            {" "}
            {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
          </span>
          <ChevronRight
            size={20}
            strokeWidth={2.5}
            className=" text-white mt-[1px]"
          />
        </div>

        <div
          className="flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 rounded"
          onClick={onOpenQualityDrawer}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              strokeWidth={2.5}
              size={20}
              className="text-white-400"
            />
            <span className="text-white text-sm font-medium leading-none">
              Quality
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-400 leading-none">
            {selectedQuality.toLowerCase() === "auto"
              ? "Auto"
              : selectedQuality}
            <ChevronRight
              size={20}
              strokeWidth={2.5}
              className=" text-white mt-[4px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
