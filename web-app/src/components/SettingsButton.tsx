// In SettingsButton.tsx
import React from "react";
import { Settings } from "lucide-react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faGear } from "@fortawesome/free-solid-svg-icons";

interface SettingsButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled: boolean;
}

const SettingsButton = React.forwardRef<HTMLButtonElement, SettingsButtonProps>(
  ({ onClick, isDisabled }, ref) => {
    return (
      <div>
        <button
          ref={ref}
          onClick={onClick}
          disabled={isDisabled}
          className="text-white hover:text-blue-400"
          title="Settings"
        >
          <Settings strokeWidth={2.5} className="text-[24px] mt-1" />
        </button>
      </div>
    );
  }
);

export default SettingsButton;
