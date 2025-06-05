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
        <h4 className="text-base font-semibold text-gray-700 mb-3">Theme</h4>

        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme)}
              className={`
                relative p-1 border-2 transition-all duration-200
                ${
                  currentTheme?.id === theme.id
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="space-y-2">
                <div className="flex flex-row w-full border rounder-border">
                  <div
                    className="flex-1 h-6"
                    style={{ backgroundColor: theme.backgroundColor }}
                  />
                  <div
                    className="flex-1 h-6"
                    style={{ backgroundColor: theme.textColor }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200"></div>
      </div>
    </div>
  );
};

export default Settings;
