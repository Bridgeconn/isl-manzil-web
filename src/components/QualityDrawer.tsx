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
  onBackToSettings
}) => {

  if (!isVisible) return null;

  return (
    <div className="absolute space-y-2 max-h-70 overflow-y-auto pr-1 custom-scrol bottom-16 h-65 right-4 w-64 p-4 rounded-lg bg-black bg-opacity-90 text-white shadow-lg z-50">
      <div>
        <div className="flex  items-center mb-4">
          <ChevronLeft size={20} className="cursor-pointer" onClick={onBackToSettings} />
          <span className="text-lg font-semibold ml-4 text-xs">Quality</span>
        </div>
        <div className="h-px bg-gray-600  w-full" />
      </div>
      <div className="space-y-2">
        {availableQualities.map(({ id, label }) => (
          <div
            key={id}
            onClick={() => {
              onSelect(id);
              onClose();
            }}
            className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-700 ${id === selectedQuality ? "bg-gray-700 text-white" : "text-gray-300"
              }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityDrawer;
