import React, { useState } from "react";
import { Twitter, Mail, Link2, X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWhatsapp,
  faLinkedin,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";

interface SharePopupProps {
  shareUrl: string;
  onClose: () => void;
}

const SharePopup: React.FC<SharePopupProps> = ({ shareUrl, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>

      {copied && (
      <div className="fixed top-25 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-4 py-2 rounded-md shadow-md flex items-center gap-2 z-[60]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="font-medium">Copied</span>
        <button onClick={() => setCopied(false)} className="ml-2">
          <X size={16} className="text-white hover:text-gray-300" />
        </button>
      </div>
    )}
    <div className="absolute bottom-18 right-4 w-72 bg-white rounded-lg shadow-xl p-4 z-50">
      <div className="flex justify-between items-center mb-3 ">
        <span className="text-lg font-semibold text-red-600">Share</span>
        <button onClick={onClose} aria-label="Close share popup">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={copyToClipboard}
          className="flex flex-col items-center text-sm"
        >
          <Link2 strokeWidth={2.5} className="text-red-500" />
          <div className="text-sm">Copy URL</div>
        </button>
       

        <a
          href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-sm"
        >
          <FontAwesomeIcon
            strokeWidth={2.5}
            icon={faFacebook}
            className="text-blue-600 text-2xl"
          />
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
            shareUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-sm"
        >
          <Twitter strokeWidth={2.5} className="text-sky-500 w-6 h-6" />
          Twitter
        </a>
        <a
          href={`mailto:?subject&body=${encodeURIComponent(shareUrl)}`}
          className="flex flex-col items-center text-sm"
        >
          <Mail strokeWidth={2.5} className="text-gray-600" />
          Email
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-sm"
        >
          <FontAwesomeIcon
            strokeWidth={2.5}
            icon={faWhatsapp}
            className="text-green-500 text-2xl"
          />
          WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-sm"
        >
          <FontAwesomeIcon
            strokeWidth={2.5}
            icon={faLinkedin}
            className="text-blue-700 text-2xl"
          />
          LinkedIn
        </a>
      </div>
    </div>
    </>
  );
};

export default SharePopup;
