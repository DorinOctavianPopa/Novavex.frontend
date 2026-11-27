import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import GroupsIcon from "@mui/icons-material/Groups";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import type { SvgIconComponent } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/context";
import {
  accountingPolicy,
  inventoryReadPolicy,
  isAuthorized,
  organizationReadPolicy,
  userManagementReadPolicy,
} from "@/services";

interface NavItem {
  readonly key: string;
  readonly labelKey: string;
  readonly icon: SvgIconComponent;
  readonly path?: string;
  readonly allowed: boolean;
}

// Material Dashboard 2-style left sidenav: brand mark, primary navigation (reusing the
// same access policies as the router so locked/disabled items match what AppRoutes would
// actually allow), and a footer mini-profile with sign out.
export function DashboardSidenav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { session, signOut } = useAppContext();

  if (!session) {
    return null;
  }

  const navItems: readonly NavItem[] = [
    {
      key: "dashboard",
      labelKey: "dashboard.sidenav.nav.dashboard",
      icon: SpaceDashboardIcon,
      path: "/",
      allowed: true,
    },
    {
      key: "inventory",
      labelKey: "dashboard.sidenav.nav.inventory",
      icon: Inventory2Icon,
      path: "/inventory",
      allowed: isAuthorized(session, inventoryReadPolicy),
    },
    {
      key: "accounting",
      labelKey: "dashboard.sidenav.nav.accounting",
      icon: AccountBalanceIcon,
      path: "/accounting",
      allowed: isAuthorized(session, accountingPolicy),
    },
    {
      key: "users",
      labelKey: "dashboard.sidenav.nav.users",
      icon: ManageAccountsIcon,
      path: "/users",
      allowed: isAuthorized(session, userManagementReadPolicy),
    },
    {
      key: "organizations",
      labelKey: "dashboard.sidenav.nav.organizations",
      icon: CorporateFareIcon,
      path: "/organizations",
      allowed: isAuthorized(session, organizationReadPolicy),
    },
    {
      // No CRM route exists yet; the item stays locked everywhere until that module ships.
      key: "crm",
      labelKey: "dashboard.sidenav.nav.crm",
      icon: GroupsIcon,
      allowed: false,
    },
  ];

  return (
    <nav
      className="dashboard-sidenav"
      aria-label={t("dashboard.sidenav.ariaLabel")}
    >
      <div className="dashboard-sidenav__brand">
        <span className="dashboard-sidenav__brand-mark">N</span>
        <span>{t("app.name")}</span>
      </div>

      <ul className="dashboard-sidenav__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            Boolean(item.path) && location.pathname === item.path;
          const label = (
            <>
              <Icon fontSize="small" />
              <span>{t(item.labelKey)}</span>
              {!item.allowed ? (
                <LockIcon
                  className="dashboard-sidenav__lock"
                  fontSize="inherit"
                />
              ) : null}
            </>
          );

          return (
            <li key={item.key}>
              {item.path && item.allowed ? (
                <Link
                  to={item.path}
                  className={`dashboard-sidenav__link${
                    isActive ? " dashboard-sidenav__link--active" : ""
                  }`}
                >
                  {label}
                </Link>
              ) : (
                <span className="dashboard-sidenav__link dashboard-sidenav__link--disabled">
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="dashboard-sidenav__footer">
        <Link to="/support" className="dashboard-sidenav__footer-link">
          <SupportAgentIcon fontSize="small" />
          <span>{t("dashboard.sidenav.nav.support")}</span>
        </Link>
        <Link to="/privacy" className="dashboard-sidenav__footer-link">
          <PrivacyTipIcon fontSize="small" />
          <span>{t("dashboard.sidenav.nav.privacy")}</span>
        </Link>

        <div className="dashboard-sidenav__profile">
          <p className="dashboard-sidenav__profile-email">
            {session.user.email}
          </p>
          <p className="dashboard-sidenav__profile-roles">
            {session.user.roles.length > 0
              ? session.user.roles.join(", ")
              : t("dashboard.sidenav.noRoles")}
          </p>
          <button
            type="button"
            className="dashboard-sidenav__sign-out"
            onClick={signOut}
          >
            <LogoutIcon fontSize="small" />
            {t("dashboard.sidenav.nav.signOut")}
          </button>
        </div>
      </div>
    </nav>
  );
}
