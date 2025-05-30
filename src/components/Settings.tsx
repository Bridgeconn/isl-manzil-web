import React from "react";
import { X } from "lucide-react";
import useThemeStore from "../store/useThemeStore";

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { currentTheme, themes, setTheme } = useThemeStore();

  return (
    <div className="w-80 bg-white border border-gray-200 shadow-lg p-4 pt-2 relative z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close settings"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-2 sm:space-y-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Theme</h4>

        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${
                  currentTheme?.id === theme.id
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="space-y-2">
                <div
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: theme.backgroundColor }}
                />
                <div className="text-xs font-medium text-gray-600">
                  {theme.name}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.backgroundColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.textColor }}
                  />
                </div>
              </div>

              {currentTheme?.id === theme.id && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200"></div>
      </div>
    </div>
  );
};

export default Settings;
