import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAppContext } from "@/context";
import {
  AuthenticationPage,
  CreateAccountPage,
} from "@/features/authentication";
import { DashboardPage } from "@/features/dashboard";
import { AccountingModulePage } from "@/features/financial";
import { InventoryModulePage } from "@/features/inventory";
import { AccountingPage } from "@/features/accounting";
import { isAuthorized } from "@/services";
import type { AuthSession } from "@/types";
import { useTranslation } from "react-i18next";

const dashboardPolicy = {
  anyRoles: [
    "super_admin",
    "cto",
    "finance_manager",
    "senior_accountant",
    "junior_accountant",
    "inventory_manager",
  ] as const,
  allScopes: ["dashboard:read"] as const,
};

const inventoryReadPolicy = {
  anyRoles: ["super_admin", "cto", "inventory_manager"] as const,
  allScopes: ["inventory:read"] as const,
};

const accountingPolicy = {
  anyRoles: ["super_admin", "cto", "finance_manager", "senior_accountant", "junior_accountant"] as const,
};

function AccessDeniedView() {
  const { t } = useTranslation();

  return (
    <main className="dashboard-page" aria-live="polite">
      <h1>{t("auth.accessDenied")}</h1>
      <p>{t("auth.noPermission")}</p>
    </main>
  );
}

function AuthorizedRoute({
  session,
  policy,
  children,
}: Readonly<{
  session: AuthSession;
  policy: Parameters<typeof isAuthorized>[1];
  children: React.ReactNode;
}>) {
  if (!isAuthorized(session, policy)) {
    return <AccessDeniedView />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const { session, signIn, signUp } = useAppContext();
  const [authView, setAuthView] = useState<"sign-in" | "create-account">(
    "sign-in",
  );

  if (!session?.isAuthenticated) {
    if (authView === "create-account") {
      return (
        <CreateAccountPage
          onCreateAccount={signUp}
          onNavigateToSignIn={() => {
            setAuthView("sign-in");
          }}
        />
      );
    }

    return (
      <AuthenticationPage
        onAuthenticate={signIn}
        onNavigateToCreateAccount={() => {
          setAuthView("create-account");
        }}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthorizedRoute session={session} policy={dashboardPolicy}>
            <DashboardPage />
          </AuthorizedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <AuthorizedRoute session={session} policy={inventoryReadPolicy}>
            <InventoryModulePage />
          </AuthorizedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <AuthorizedRoute session={session} policy={accountingPolicy}>
            <AccountingPage />
          </AuthorizedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
