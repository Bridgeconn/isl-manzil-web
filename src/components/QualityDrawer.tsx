import React from "react";
import { ChevronLeft } from "lucide-react";

interface QualityDrawerProps {
  isVisible: boolean;
  selectedQuality: string;
  availableQualities: { id: string; label: string }[];
  onSelect: (quality: string) => void;
  onClose: () => void;
  onBackToSettings: () => void;
}

const QualityDrawer: React.FC<QualityDrawerProps> = ({
  isVisible,
  selectedQuality,
  availableQualities,
  onSelect,
  onClose,
  onBackToSettings,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute py-1 max-h-65 overflow-y-auto pr-1  custom-scroll-black bottom-18 h-auto right-4 w-48 p-4 rounded-lg bg-black bg-opacity-90 text-white shadow-lg z-50">
      <div>
        <div className="flex  items-center mb-2">
          <ChevronLeft
            strokeWidth={2.5}
            size={20}
            className="cursor-pointer"
            onClick={onBackToSettings}
          />
          <span className="text-300 font-semibold ml-4 py-2 ">Quality</span>
        </div>
        <div className="h-px bg-gray-600  w-full mt-0.5" />
      </div>
      <div className="space-y-2">
        {availableQualities.map(({ id }) => {
          const HD_QUALITIES = ["1080p", "1440p", "2160p"];
          const isHD = HD_QUALITIES.includes(id);
          const isAuto = id.toLowerCase() === "auto";

          return (
            <div
              key={id}
              onClick={() => {
                onSelect(id);
                onClose();
              }}
              className={`cursor-pointer px-3 py-1 rounded hover:bg-gray-700 flex items-center justify-between ${
                id === selectedQuality
                  ? "bg-gray-700 text-white-300"
                  : "text-white-300"
              }`}
            >
              <span className="flex items-center gap-1">
                {isAuto ? "Auto" : id}
                {isHD && (
                  <sup className="text-[10px] text-gray-400 ml-0.5 font-semibold">
                    HD
                  </sup>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QualityDrawer;
