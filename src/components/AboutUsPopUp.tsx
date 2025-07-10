import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const AboutUsPopUp: React.FC<{ showAbout: boolean; onClose: () => void }> = ({
  showAbout,
  onClose,
}) => {
  return (
    <Dialog open={showAbout} onOpenChange={onClose}>
      <DialogContent className="w-full !max-w-4xl max-h-[90vh] bg-white rounded shadow-xl flex flex-col overflow-hidden z-[9999]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            About ISL Bible
          </DialogTitle>
        </DialogHeader>

        <div
          className="space-y-4 text-sm text-gray-800 overflow-y-auto grow"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <section>
            <h3 className="text-lg font-semibold">The ISLV Bible Website</h3>
          </section>
          <section>
            <p>
              The <strong>Indian Sign Language Video (ISLV) Bible</strong> is a
              web application presented in Indian Sign Language. Its aim is to
              provide 64 million Deaf individuals across India access to
              Scripture in their native “heart language”.
            </p>
          </section>
          <section>
            <p>
              The ISLV Bible is a meaningful digital outreach—combining video
              Scripture in Indian Sign Language through a website and a
              user-friendly app. It empowers Deaf believers by making God’s Word
              fully accessible, culturally relevant, and easily shareable.
            </p>
          </section>
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
            <h3 className="text-lg font-semibold">Technology</h3>
          </section>
          <section>
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
            <p>Features Available: </p>
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

          <section>
            <h3 className="text-lg text-black-300 font-semibold">Contact Us</h3>
            <a
              href="mailto:thevachanproject@bridgeconn.com"
              className="text-blue-500"
            >
              islvbible@bridgeconn.com
            </a>
          </section>
        </div>

        <DialogFooter className="p-3 border-t flex ">
          <button
            onClick={onClose}
            className="
            text-sm sm:text-base
            px-2 py-1 sm:px-4 sm:py-2
            border rounded
            hover:bg-gray-200 cursor-pointer
            w-24 sm:w-auto
            mx-auto
          "
          >
            CLOSE
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AboutUsPopUp;
