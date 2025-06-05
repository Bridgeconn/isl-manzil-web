// In SettingsButton.tsx
import React from "react";
import { Settings } from "lucide-react";

interface SettingsButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled: boolean;
}

const SettingsButton = React.forwardRef<HTMLButtonElement, SettingsButtonProps>(
  ({ onClick, isDisabled }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        className="text-white hover:text-blue-400"
        title="Settings"
      >
        <Settings size={24} />
      </button>
    );
  }
);

export default SettingsButton;
