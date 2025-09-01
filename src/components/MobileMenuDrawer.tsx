import React from "react";
import Settings from "./Settings";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const MobileMenuDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 right-0 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Settings onCloseDrawer={onClose} />
      </div>
    </>
  );
};

export default MobileMenuDrawer;
