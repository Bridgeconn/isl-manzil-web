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
    <div
      className="absolute py-0.5 md:py-1 bottom-10 md:bottom-12 right-4 w-30 sm:w-40 md:w-50 p-2 md:p-4 rounded-lg bg-black bg-opacity-90 text-white shadow-lg z-50 
                    max-h-[150px] sm:max-h-[180px] md:max-h-[280px] xl:max-h-[380px]
                    overflow-y-auto pr-1 custom-scroll-black themed-bg"
    >
      <div>
        <div className="flex items-center mb-1 sm:mb-2 themed-text">
          <ChevronLeft
            strokeWidth={2.5}
            size={16}
            className="sm:w-5 sm:h-5 cursor-pointer"
            onClick={onBackToSettings}
          />
          <span className="text-sm sm:text-base text-300 font-semibold ml-2 sm:ml-4 py-1 sm:py-2 ">
            Quality
          </span>
        </div>
        <div className="h-px bg-gray-600  w-full mt-0.5" />
      </div>
      <div className="mt-1 space-y-1 sm:space-y-2 max-h-[80px] sm:max-h-[120px] md:max-h-[180px] xl:max-h-[240px] overflow-y-auto">
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
              className={`cursor-pointer px-2 sm:px-3 py-0.5 md:py-1 rounded hover:bg-gray-600 flex items-center justify-between ${
                id === selectedQuality
                  ? "bg-gray-600 text-white-300"
                  : "text-white-300 themed-text hover:!text-white"
              }`}
            >
              <span className="flex items-center gap-1 text-sm sm:text-base">
                {isAuto ? "Auto" : id}
                {isHD && (
                  <sup className="text-[8px] sm:text-[10px] text-gray-400 ml-0.5 font-semibold">
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
