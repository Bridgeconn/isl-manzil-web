import Header from "./Header";
import Footer from "./Footer";
import MobileBottomBar from "./MobileBottomBar";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shouldUseMobileBottomBar } = useDeviceDetection();

  return (
    <div className="layout-container">
      {!shouldUseMobileBottomBar && <Header />}
      
      <main className="layout-main">
        <div className="w-full h-full mx-auto flex flex-col">{children}</div>
      </main>
      
      {!shouldUseMobileBottomBar && <Footer />}
      
      {shouldUseMobileBottomBar && <MobileBottomBar />}
    </div>
  );
};

export default Layout;