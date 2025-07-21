// components/PlaybackDrawer.tsx

import { forwardRef } from "react";
import { ChevronLeft } from "lucide-react";
import useBibleStore from "@/store/useBibleStore";

interface PlaybackDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onBackToSettings: () => void;
}

const PlaybackDrawer = forwardRef<HTMLDivElement, PlaybackDrawerProps>(
  (
    { isVisible, onClose, playbackSpeed, onChangeSpeed, onBackToSettings },
    ref
  ) => {
    const { setPlaybackSpeed } = useBibleStore();
    if (!isVisible) return null;

    const speeds = [0.25, 0.5, 1, 1.25, 1.5, 2];

    return (
      <div
        ref={ref}
        className="absolute py-0.5 md:py-1 bottom-10 md:bottom-12 right-4 w-35 sm:w-40 md:w-50 p-2 md:p-4 rounded-lg bg-black bg-opacity-90 text-white shadow-lg z-50 
                    
                   "
      >
        <div>
          <div className="flex items-center mt-3 sm:mb-3 gap:1 gap-x-2">
            <ChevronLeft
              strokeWidth={2.5}
              size={16}
              className="sm:w-5 sm:h-5 cursor-pointer -ml-2"
              onClick={onBackToSettings}
            />

            <span className="text-sm sm:text-base text-300 font-semibold  ">
              Playback Speed
            </span>
          </div>
          <div className="h-px bg-gray-600  w-full mt-0.5" />
        </div>
        <div className="mt-1 max-h-[100px] sm:max-h-[120px] md:max-h-[180px] xl:max-h-[240px] overflow-y-auto space-y-1 pr-1 custom-scroll-black">
          <ul>
            {speeds.map((speed) => (
              <li
                key={speed}
                onClick={() => {
                  setPlaybackSpeed(speed);
                  onChangeSpeed(speed);
                  onClose();
                }}
                className={`cursor-pointer  text-sm sm:text-base text-300 px-2 sm:px-3 py-0.5 md:py-1 mt-1 rounded hover:bg-gray-700 ${
                  speed === playbackSpeed ? "bg-gray-700" : ""
                }`}
              >
                {speed === 1 ? "Normal" : speed}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
);

export default PlaybackDrawer;
