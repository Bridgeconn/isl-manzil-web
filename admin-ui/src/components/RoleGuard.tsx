import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export default function RoleGuard() {
  const { loading, isPendingApproval } = useUserRole();
  const location = useLocation();

  if (loading) {
    return null; // or spinner
  }

  // If pending approval, redirect to pending page
  if (isPendingApproval && location.pathname !== "/pendingapproval") {
    return <Navigate to="/pendingapproval" replace />;
  }

  // If approved user tries to access pending page, redirect to dashboard
  if (!isPendingApproval && location.pathname === "/pendingapproval") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
