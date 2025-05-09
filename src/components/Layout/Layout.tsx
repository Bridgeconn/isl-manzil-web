import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout-container">
      <Header />
      <main className="layout-main">
        <div className="max-w-6xl w-full h-full mx-auto">{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
