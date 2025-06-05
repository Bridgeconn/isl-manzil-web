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
      <div className="mt-1.25">
        <button
          ref={ref}
          onClick={onClick}
          disabled={isDisabled}
          className="text-white hover:text-blue-400"
          title="Settings"
        >
          <Settings strokeWidth={2.5} size={25} />
        </button>
      </div>
    );
  }
);

export default SettingsButton;
