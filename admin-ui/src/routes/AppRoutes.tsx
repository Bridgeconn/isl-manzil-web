import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Languages from "@/pages/Languages";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/languages" element={<Languages />} />
      </Route>
    </Routes>
  );
}

