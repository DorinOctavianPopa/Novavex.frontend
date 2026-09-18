import { useAppContext } from "@/context";
import { DashboardPage } from "@/features/dashboard";
import { isAuthorized } from "@/services";

import { AuthenticationPage } from "./AuthenticationPage";

const dashboardPolicy = {
  anyRoles: [
    "super_admin",
    "cto",
    "finance_manager",
    "inventory_manager",
  ] as const,
  allScopes: ["dashboard:read"] as const,
};

export function AppRoutes() {
  const { session, signIn } = useAppContext();

  if (!session.isAuthenticated) {
    return <AuthenticationPage onSubmit={signIn} />;
  }

  if (!isAuthorized(session, dashboardPolicy)) {
    return (
      <main className="dashboard-page" aria-live="polite">
        <h1>Access denied</h1>
        <p>You do not have permission to view this area.</p>
      </main>
    );
  }

  return <DashboardPage />;
}
