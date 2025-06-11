import React, { useState } from "react";
import { X, Copy } from "lucide-react";

import {
  FacebookShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  EmailShareButton,
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
        <div className="fixed top-18 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-4 py-2 rounded-md shadow-md flex items-center gap-2 z-[60]">
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

      <div className="absolute bottom-14 right-4 w-68 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
        {/* <div className="flex justify-between items-center mb-3 ">
          <span className="text-lg ml-6 font-semibold text-black-600">Share</span>
          <button onClick={onClose} aria-label="Close share popup">
            <X size={18} />
          </button>
        </div> */}
        <div className="mb-5 text-center text-sm text-gray-800 break-words">
          <a href={shareUrl} className="text-blue-600 underline">
            {shareUrl}
          </a>
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className=" flex items-center justify-center gap-2 text-sm border rounded px-3 py-2 mx-auto text-gray-700 hover:bg-gray-100 mb-4"
        >
          <Copy strokeWidth={2} className="text-gray-600" />
          Copy To Clipboard
        </button>

        {/* Share Icons */}
        <div className="flex justify-center gap-4">
          <FacebookShareButton url={shareUrl}>
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <WhatsappShareButton url={shareUrl}>
            <WhatsappIcon size={32} round />
          </WhatsappShareButton>
          <TwitterShareButton url={shareUrl}>
            <XIcon size={32} round />
          </TwitterShareButton>
          <EmailShareButton url={shareUrl}>
            <EmailIcon size={32} round />
          </EmailShareButton>
          <LinkedinShareButton url={shareUrl}>
            <LinkedinIcon size={32} round />
          </LinkedinShareButton>
        </div>
      </div>
    </>
  );
};

export default SharePopup;
