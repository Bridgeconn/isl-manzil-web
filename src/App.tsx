import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import "./App.css";
import useThemeStore from "./store/useThemeStore";
import { useEffect } from "react";

function App() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

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
