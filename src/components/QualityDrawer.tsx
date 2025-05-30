import React from "react";

interface QualityDrawerProps {
  isVisible: boolean;
  selectedQuality: string;
  availableQualities: string[];

  onSelect: (quality: string) => void;
  onClose: () => void;
}

const QualityDrawer: React.FC<QualityDrawerProps> = ({
  isVisible,
  selectedQuality,
  availableQualities,
  onSelect,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-16 right-4 w-64 p-4 rounded-lg bg-black bg-opacity-90 text-white shadow-lg z-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">Select Quality</span>
        <button onClick={onClose} className="text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2">
        {availableQualities.map((quality) => (
          <div
            key={quality}
            onClick={() => {
              onSelect(quality);
              onClose();
            }}
            className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-700 ${
              quality === selectedQuality
                ? "bg-gray-700 text-white"
                : "text-gray-300"
            }`}
          >
            {quality}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityDrawer;
