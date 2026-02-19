import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import useThemeStore from "@/store/useThemeStore";
import CleanVimeoPlayer from "./CleanVimeoPlayer";
import useModalStore from "@/store/useModalStore";
import HoverControlledGif from "./HoverControlledGif";

const AboutUsPopUp: React.FC<{
  showAbout: boolean;
  onClose: () => void;
  hideVideoSection?: boolean;
  closeImage?: string;
}> = ({ showAbout, onClose, hideVideoSection = false, closeImage }) => {
  const { fontType, fontSize, currentTheme } = useThemeStore();

  const setModalOpen = useModalStore((state) => state.setModalOpen);

  useEffect(() => {
    setModalOpen(showAbout);
    return () => setModalOpen(false);
  }, [showAbout, setModalOpen]);

  const contactEmail = "islvbible@bridgeconn.com";

  return (
    <Dialog open={showAbout} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col mt-4 
   max-h-[90vh] p-0 gap-0  translate-x-[-60%]  [&>button.absolute:not(.my-gif-close)]:hidden"
      >
        <DialogClose
          className="absolute right-5 top-5 rounded-md cursor-pointer focus:outline-none"
          asChild
        >
          <button
            title="Hide About Us Text"
            className="my-gif-close"
            onClick={onClose}
          >
            {closeImage && (
              <HoverControlledGif
                src={closeImage}
                alt="close"
                className="w-14 h-14 -mt-4 cursor-pointer"
                duration={3000}
                loopCount={Infinity}
              />
            )}
          </button>
        </DialogClose>
        <DialogHeader className="p-4 border-b">
          <DialogTitle
            className={`text-xl ${
              fontType === "serif" ? "font-serif" : "font-sans"
            } `}
            style={{
              fontSize: `${fontSize}px`,
            }}
          >
            <p style={{ fontSize: "1.4em" }}>About Us</p>
          </DialogTitle>
        </DialogHeader>

        <div
          className={`space-y-2 text-sm text-gray-800 overflow-y-auto custom-scroll-ultra-thin grow antialiased tracking-wide p-4 ${
            fontType === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            fontSize: `${fontSize}px`,
          }}
        >
          {!hideVideoSection && (
            <div>
              <p style={{ fontSize: "1.4em", marginBottom: 0 }}>
                The ISLV Bible Website
              </p>
              <div>
                <CleanVimeoPlayer videoId={1105756880} />
              </div>
            </div>
          )}
          <p>
            The <strong>Indian Sign Language Video (ISLV) Bible</strong> is a
            web application presented in Indian Sign Language. Its aim is to
            provide 64 million Deaf individuals across India access to Scripture
            in their native “heart language”.
          </p>

          <p>
            The ISLV Bible is a meaningful digital outreach combining video
            Scripture in Indian Sign Language through a website and a user
            friendly app. It empowers Deaf believers by making God’s Word fully
            accessible, culturally relevant, and easily shareable.
          </p>

          <section>
            <p>
              You are free to use this website for personal Bible study or small
              groups and gatherings. Please note that many of the resources
              available are copyrighted. These are being made available here
              under multiple licensing arrangements. Hence, the content is not
              for further redistribution in any other format or platform without
              explicit permission from the original copyright owners.
            </p>
          </section>

          <p style={{ fontSize: "1.4em", marginBottom: 0 }}>Contact Us</p>

          <p>
            For queries or issues, email us at&nbsp;
            <a
              href={`mailto:${contactEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              {contactEmail}
            </a>
          </p>

          <section className="py-2 text-center text-sm hover:text-gray-500">
            <a
              href="https://bridgeconn.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-lg relative top-[2px]">©</span> Bridge
              Connectivity Solutions Pvt. Ltd. 2025
            </a>
          </section>
        </div>

        <DialogFooter className="p-3 border-t flex  ">
          <button
            onClick={onClose}
            className={`
            text-sm sm:text-lg
            px-6 py-2
            border rounded-full shadow-md
            cursor-pointer
            w-24 sm:w-auto
            mx-auto
          ${fontType === "serif" ? "font-serif" : "font-sans"}`}
            style={{
              color: currentTheme?.textColor,
              backgroundColor: currentTheme?.backgroundColor,

              borderWidth: "0.5px",
            }}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AboutUsPopUp;
