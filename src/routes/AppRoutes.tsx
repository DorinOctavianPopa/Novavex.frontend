import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAppContext } from "@/context";
import {
  AuthenticationPage,
  CreateAccountPage,
  PrivacyPage,
  SupportPage,
} from "@/features/authentication";
import { DashboardPage } from "@/features/dashboard";
import { InventoryModulePage } from "@/features/inventory";
import { AccountingPage } from "@/features/accounting";
import { OrganizationManagementPage } from "@/features/organization";
import { UserManagementPage } from "@/features/userManagement";
import {
  accountingPolicy,
  dashboardPolicy,
  inventoryReadPolicy,
  isAuthorized,
  organizationReadPolicy,
  userManagementReadPolicy,
} from "@/services";
import type { AuthSession } from "@/types";
import { useTranslation } from "react-i18next";

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
  const {
    session,
    mfaChallenge,
    signIn,
    verifyMfaCode,
    resendMfaCode,
    cancelMfaChallenge,
    signUpMfaChallenge,
    signUp,
    verifySignUpMfaCode,
    resendSignUpMfaCode,
    cancelSignUpMfaChallenge,
  } = useAppContext();
  const [authView, setAuthView] = useState<"sign-in" | "create-account">(
    "sign-in",
  );

  if (!session?.isAuthenticated) {
    return (
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route
          path="*"
          element={
            authView === "create-account" ? (
              <CreateAccountPage
                onCreateAccount={signUp}
                onNavigateToSignIn={() => {
                  setAuthView("sign-in");
                }}
                mfaChallenge={signUpMfaChallenge}
                onVerifyMfaCode={verifySignUpMfaCode}
                onResendMfaCode={resendSignUpMfaCode}
                onCancelMfaChallenge={cancelSignUpMfaChallenge}
              />
            ) : (
              <AuthenticationPage
                onAuthenticate={signIn}
                onNavigateToCreateAccount={() => {
                  setAuthView("create-account");
                }}
                mfaChallenge={mfaChallenge}
                onVerifyMfaCode={verifyMfaCode}
                onResendMfaCode={resendMfaCode}
                onCancelMfaChallenge={cancelMfaChallenge}
              />
            )
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/support" element={<SupportPage />} />
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
      <Route
        path="/users"
        element={
          <AuthorizedRoute session={session} policy={userManagementReadPolicy}>
            <UserManagementPage />
          </AuthorizedRoute>
        }
      />
      <Route
        path="/organizations"
        element={
          <AuthorizedRoute session={session} policy={organizationReadPolicy}>
            <OrganizationManagementPage />
          </AuthorizedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
