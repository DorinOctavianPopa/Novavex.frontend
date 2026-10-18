import { useState } from "react";

import { useAppContext } from "@/context";
import {
  AuthenticationPage,
  CreateAccountPage,
} from "@/features/authentication";
import { DashboardPage } from "@/features/dashboard";
import { isAuthorized } from "@/services";
import { useTranslation } from "react-i18next";

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
  const { session, signIn, signUp } = useAppContext();
  const { t } = useTranslation();
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

  if (!isAuthorized(session, dashboardPolicy)) {
    return (
      <main className="dashboard-page" aria-live="polite">
        <h1>{t("auth.accessDenied")}</h1>
        <p>{t("auth.noPermission")}</p>
      </main>
    );
  }

  return <DashboardPage />;
}
