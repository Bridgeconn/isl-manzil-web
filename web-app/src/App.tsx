import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import Landing from "./pages/Landing";
import "./App.css";
import useThemeStore from "./store/useThemeStore";
import { useEffect } from "react";
import useBibleStore from "./store/useBibleStore";
import { Routes, Route } from "react-router-dom";
import Dictionary from "./pages/dictionary";
import BibleProjects from "./pages/bibleprojects";

function App() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const bookCode = pathParts[2];
    const chapterPart = pathParts[3];
    const isShareUrl = !!bookCode && !!chapterPart;
    useBibleStore.getState().initializeAvailableData(!isShareUrl);
  }, []);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  return (
    <Layout>
    <Routes>
      {/* NEW landing page */}
      <Route path="/" element={<Landing />} />
      <Route path="/dictionary" element={<Dictionary />} />
      <Route path="/projects" element={<BibleProjects />} />
      {/* EXISTING behavior */}
      <Route path="/*" element={<HomePage />} />
    </Routes>
  </Layout>
);

}

export default App;
