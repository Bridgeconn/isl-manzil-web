import { Routes, Route } from "react-router-dom";
import * as reactRouterDom from "react-router-dom";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import { EmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import { SessionAuth } from "supertokens-auth-react/recipe/session";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Languages from "@/pages/Languages";
import Versions from "@/pages/Versions";
import Licenses from "@/pages/Licenses";

export default function AppRoutes() {
  return (
    <Routes>
      {/* SuperTokens Auth Routes */}
      {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [
  EmailPasswordPreBuiltUI,
])}

      {/* Protected Admin Routes */}
      <Route
        element={
          <SessionAuth>
            <AdminLayout />
          </SessionAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/languages" element={<Languages />} />
        <Route path="/versions" element={<Versions />} />
        <Route path="/licenses" element={<Licenses />} />
      </Route>
    </Routes>
  );
}

