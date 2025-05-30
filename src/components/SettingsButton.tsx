// components/SettingsButton.tsx
import React from "react";
import { Settings } from "lucide-react";

interface SettingsButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled: boolean;
  title?: string;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  onClick,
  isDisabled,
  title = "Settings",
}) => {
  return (
    <button
      onClick={onClick}
      className="text-white hover:text-blue-400"
      title={title}
      disabled={isDisabled}
    >
      <Settings size={24} />
    </button>
  );
};

export default SettingsButton;
