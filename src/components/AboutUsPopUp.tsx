import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import useThemeStore from "@/store/useThemeStore";

const AboutUsPopUp: React.FC<{ showAbout: boolean; onClose: () => void }> = ({
  showAbout,
  onClose,
}) => {
  const { fontType, fontSize, currentTheme } = useThemeStore();

  return (
    <Dialog open={showAbout} onOpenChange={onClose}>
      <DialogContent className="w-full !max-w-4xl max-h-[90vh] bg-white rounded shadow-xl flex flex-col overflow-hidden z-[9999] p-0 gap-0 [&>button.absolute.right-4.top-4]:hidden themed-bg">
        <DialogClose
          className="absolute right-5 top-5 rounded-md cursor-pointer focus:outline-none"
          asChild
        >
          <X
            style={{
              color: currentTheme?.textColor,
              width: "20px",
              height: "20px",
            }}
          />
        </DialogClose>
        <DialogHeader className="p-4 border-b">
          <DialogTitle
            className={`text-xl  ${
              fontType === "serif" ? "font-serif" : "font-sans"
            } `}
            style={{
              fontSize: `${fontSize}px`,
              color: currentTheme?.textColor,
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
            color: currentTheme?.textColor,
          }}
        >
          <p style={{ fontSize: "1.4em", marginBottom: 0 }}>
            {" "}
            The ISLV Bible Website
          </p>
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

          <section>
            <p style={{ fontSize: "1.4em" }}>Technology</p>
            <p>
              BCS team has developed this platform inspired by similar
              initiatives in other countries. The website is developed using
              modern web technologies including <strong>React</strong> for the
              frontend and <strong>Vite</strong> for fast development and
              bundling. State management is handled using{" "}
              <strong>Zustand</strong>, and video playback is optimized using{" "}
              <strong>Vimeo</strong> and custom React components.
            </p>
          </section>
          <section>
            <p style={{ fontSize: "1.4em" }}>Features Available: </p>
            <p>
              <strong>Organized Access:</strong> Books and chapters with
              available ISLV content are clearly marked and navigable under Old
              and New Testaments.
            </p>
            <p>
              <strong>Theme:</strong> Offers multiple visual themes with
              different background and text color combinations to suit different
              reading preferences and environments.
            </p>
            <p>
              <strong>Easy Bible Navigation:</strong> Books and chapters can be
              easily accessed through intuitive dropdowns and navigation
              buttons, streamlining movement across Scripture.
            </p>
            <p>
              <strong>Playback Speed Change:</strong> Provides control over
              video playback speed, enabling slower or faster viewing based on
              individual comfort.
            </p>
            <p>
              <strong>Download Video:</strong> ISLV Bible videos can be
              downloaded for offline viewing, ensuring accessibility without the
              need for an internet connection.
            </p>
            <p>
              <strong>Change Video Quality:</strong> Video resolution options
              such as standard and high-definition (HD) are available.
            </p>
          </section>

          <p style={{ fontSize: "1.4em", marginBottom: 0 }}>Contact Us</p>
          <a
            href="mailto:thevachanproject@bridgeconn.com"
            className="text-blue-500"
          >
            islvbible@bridgeconn.com
          </a>

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

              borderWidth: "0.5px", // Very thin
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
