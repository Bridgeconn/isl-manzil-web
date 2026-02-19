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
import PendingApproval from "@/pages/pendingapprovalpage";
import Bibles from "@/pages/Bibles";
import ISL from "@/pages/ISL";

import RoleGuard from "@/components/RoleGuard";

export default function AppRoutes() {
  return (
    <Routes>

      {/* SuperTokens Auth Routes */}
      {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [
        EmailPasswordPreBuiltUI,
      ])}

      {/* Protected Routes */}
      <Route
        element={
          <SessionAuth>
            <RoleGuard />
          </SessionAuth>
        }
      >
        {/* Pending approval page */}
        <Route path="/pendingapproval" element={<PendingApproval />} />

        {/* Admin Layout Protected Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/languages" element={<Languages />} />
          <Route path="/versions" element={<Versions />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/bibles" element={<Bibles />} />
          <Route path="isl-bible" element={<ISL />} />

        </Route>

      </Route>

    </Routes>
  );
}
