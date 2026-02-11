import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Languages from "@/pages/Languages";
import Versions from "@/pages/Versions";
import Licenses from "@/pages/Licenses";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/languages" element={<Languages />} />
        <Route path="/versions" element={<Versions />} />
        <Route path="/licenses" element={<Licenses />} />
      </Route>
    </Routes>
  );
}

