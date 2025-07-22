import React, { useState } from "react";
import { X, Copy } from "lucide-react";

import {
  FacebookShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  XIcon,
} from "react-share";

import {
  FacebookIcon,
  WhatsappIcon,
  LinkedinIcon,
  EmailIcon,
} from "react-share";

interface SharePopupProps {
  shareUrl: string;
  onClose: () => void;
}

const SharePopup: React.FC<SharePopupProps> = ({ shareUrl }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {copied && (
        <div className="fixed top-2 sm:top-6 md:top-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-md flex items-center gap-1 sm:gap-2 z-90">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium text-sm sm:text-base">Copied</span>
          <button onClick={() => setCopied(false)} className="ml-1 sm:ml-2">
            <X
              size={14}
              className="sm:w-4 sm:h-4 text-white hover:text-gray-300"
            />
          </button>
        </div>
      )}

      <div className="absolute bottom-6 md:bottom-8 right-2 sm:right-4 w-62 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-2 sm:p-4 z-50 themed-bg">
        {/* URL Display */}
        <div className="flex justify-center">
          <div className="mb-3 sm:mb-5  text-center text-xs sm:text-sm text-gray-800 break-words  px-3 py-2 bg-white-100 border border-gray-300 whitespace-normal w-full">
            <a
              href={shareUrl}
              className="text-black cursor-default themed-text"
              onClick={(e) => e.preventDefault()}
            >
              {shareUrl}
            </a>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="hover-text-black-bg-gray flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm border rounded px-2 sm:px-3 py-1.5 sm:py-2 mx-auto text-gray-700 mb-4 sm:mb-4 cursor-pointer themed-text"
        >
          <Copy
            strokeWidth={2}
            className="text-gray-600 w-3 h-3 sm:w-4 sm:h-4 themed-text"
          />
          Copy To Clipboard
        </button>

        {/* Share Icons */}
        <div className="flex justify-center gap-2 sm:gap-4">
          <FacebookShareButton url={shareUrl}>
            <FacebookIcon
              className="w-8 h-8 sm:w-8 sm:h-8 rounded-full overflow-hidden inline-block"
              size={28}
              round
            />
          </FacebookShareButton>
          <WhatsappShareButton url={shareUrl}>
            <WhatsappIcon size={28} className="w-8 h-8 sm:w-8 sm:h-8" round />
          </WhatsappShareButton>
          <TwitterShareButton url={shareUrl}>
            <XIcon size={28} className="w-8 h-8 sm:w-8 sm:h-8" round />
          </TwitterShareButton>
          <a
            href={`mailto:?subject=Check this out&body=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <EmailIcon className="w-8 h-8 sm-w-8 sm:h-8 " size={28} round />
          </a>
          <LinkedinShareButton url={shareUrl}>
            <LinkedinIcon size={28} className="w-8 h-8 sm:w-8 sm:h-8" round />
          </LinkedinShareButton>
        </div>
      </div>
    </>
  );
};

export default SharePopup;
