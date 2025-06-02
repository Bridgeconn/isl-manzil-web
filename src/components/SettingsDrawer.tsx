import React from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";

interface SettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  selectedQuality: string;
  onOpenQualityDrawer: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isVisible,
  onClose,
  selectedQuality,
  onOpenQualityDrawer,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-16 right-4 bg-black bg-opacity-90 text-white rounded-lg shadow-lg w-64 p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">Settings</span>
        <button onClick={onClose} className="text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div
          className="flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 rounded"
          onClick={onOpenQualityDrawer}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-gray-400" />
            <span className="text-white text-sm font-medium leading-none">
              Quality
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-400 leading-none">
            <span>{selectedQuality}</span>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
