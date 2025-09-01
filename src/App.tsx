import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import "./App.css";
import useThemeStore from "./store/useThemeStore";
import { useEffect } from "react";
import useBibleStore from "./store/useBibleStore";

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
      <HomePage />
    </Layout>
  );
}

export default App;
