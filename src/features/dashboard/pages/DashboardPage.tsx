import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AppsIcon from "@mui/icons-material/Apps";
import BarChartIcon from "@mui/icons-material/BarChart";
import SecurityIcon from "@mui/icons-material/Security";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

import { FeatureCard, Grid } from "@/components";
import type { GridColumn } from "@/components";
import { useAppContext } from "@/context";
import {
  DashboardCard,
  DashboardSidenav,
  MiniAreaChart,
  ModuleStatusChart,
  StatCard,
} from "@/features/dashboard/components";
import { crmModule } from "@/features/crm";
import { dashboardModule } from "@/features/dashboard/pages/module";
import { financialModule } from "@/features/financial";
import { InventoryDashboardPage, inventoryModule } from "@/features/inventory";
import { useFeatureModules } from "@/hooks";
import { isAuthorized } from "@/services";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FeatureModule } from "@/types";

import "./DashboardPage.css";

// Static representative sample used by the "Access activity" chart placeholder:
// there is no real time-series activity metric wired up yet.
const sessionActivitySample = [0.3, 0.45, 0.4, 0.6, 0.55, 0.8, 0.7, 0.95];

const inventoryWritePolicy = {
  anyRoles: ["super_admin", "cto", "inventory_manager"] as const,
  allScopes: ["inventory:write"] as const,
  attributeRules: [
    { key: "department", equals: "operations" },
    { key: "region", equals: "eu" },
  ] as const,
};

export function DashboardPage() {
  const { session, security } = useAppContext();
  const { i18n, t } = useTranslation();
  const defaultModules = useFeatureModules();
  const [modules, setModules] = useState<FeatureModule[]>(() => [
    ...defaultModules,
  ]);
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language)
    .toLowerCase()
    .startsWith("ro")
    ? "ro"
    : "en";
  const heroTags = t("dashboard.hero.tags", {
    returnObjects: true,
  }) as string[];
  const rules = t("dashboard.rules.items", { returnObjects: true }) as string[];

  const featureModuleColumns: ReadonlyArray<GridColumn<FeatureModule>> = [
    {
      key: "module",
      header: t("dashboard.grid.columns.module"),
      render: (module) => (
        <div>
          <strong>{module.name}</strong>
          <p className="grid-example__description">{module.description}</p>
        </div>
      ),
      renderEditor: (module, onChange) => (
        <div className="grid-example__inline-editor">
          <input
            className="grid__edit-input"
            aria-label={t("dashboard.grid.actions.fieldName")}
            value={module.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
          <textarea
            className="grid__edit-input"
            aria-label={t("dashboard.grid.actions.fieldDescription")}
            rows={2}
            value={module.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
      ),
    },
    {
      key: "alias",
      header: t("dashboard.grid.columns.alias"),
      align: "center",
      accessor: "alias",
      editable: true,
      render: (module) =>
        module.alias ? (
          <span className="grid-example__alias">{module.alias}</span>
        ) : (
          <span className="grid-example__muted">
            {t("dashboard.grid.noRoute")}
          </span>
        ),
    },
    {
      key: "path",
      header: t("dashboard.grid.columns.path"),
      render: (module) => <code>{module.path}</code>,
    },
    {
      key: "status",
      header: t("dashboard.grid.columns.status"),
      align: "center",
      render: (module) => (
        <span className={`status status--${module.status}`}>
          {t(`status.${module.status}`)}
        </span>
      ),
    },
    {
      key: "route",
      header: t("dashboard.grid.columns.route"),
      align: "center",
      render: (module) =>
        module.route ? (
          <Link to={module.route}>{t("featureCard.runModule")}</Link>
        ) : (
          <span className="grid-example__muted">
            {t("dashboard.grid.noRoute")}
          </span>
        ),
    },
  ];

  function createModuleId(name: string, existing: ReadonlyArray<FeatureModule>) {
    const slug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `module-${Date.now()}`;
    if (!existing.some((module) => module.id === slug)) {
      return slug;
    }
    let suffix = 2;
    while (existing.some((module) => module.id === `${slug}-${suffix}`)) {
      suffix += 1;
    }
    return `${slug}-${suffix}`;
  }

  function createModule(existingModules: ReadonlyArray<FeatureModule>): FeatureModule {
    const name = t("dashboard.grid.actions.newModuleName");
    const id = createModuleId(name, existingModules);
    return {
      id,
      name,
      description: "",
      path: `src/features/${id}`,
      status: "planned",
      alias: name.slice(0, 3).toUpperCase(),
    };
  }

  function handleModuleAdded(newModule: FeatureModule) {
    setModules((current) => [...current, newModule]);
  }

  function handleSaveModule(
    updatedModule: FeatureModule,
    originalModule: FeatureModule,
  ) {
    setModules((current) =>
      current.map((item) =>
        item.id === originalModule.id ? updatedModule : item,
      ),
    );
  }

  function handleDeleteModule(module: FeatureModule) {
    setModules((current) => current.filter((item) => item.id !== module.id));
  }

  if (!session) {
    return null;
  }

  const canManageInventory = isAuthorized(session, inventoryWritePolicy);
  const readyModuleCount = modules.filter(
    (module) => module.status === "ready",
  ).length;
  const plannedModuleCount = modules.length - readyModuleCount;

  return (
    <div className="dashboard-shell">
      <DashboardSidenav />

      <main className="dashboard-page">
        <section className="hero-panel">
          <div className="hero-panel__top">
            <p className="eyebrow">{t("dashboard.hero.eyebrow")}</p>
            <label className="language-switcher">
              <span>{t("language.label")}</span>
              <select
                value={activeLanguage}
                onChange={(event) => {
                  void i18n.changeLanguage(event.target.value);
                }}
              >
                <option value="en">{t("language.options.en")}</option>
                <option value="ro">{t("language.options.ro")}</option>
              </select>
            </label>
          </div>
          <h1>{t("app.name")}</h1>
          <p className="hero-panel__summary">{t("app.summary")}</p>
          <div className="hero-panel__tags">
            {heroTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <section className="stat-cards">
          <StatCard
            icon={AppsIcon}
            tone="primary"
            label={t("dashboard.stats.modules.label")}
            value={modules.length}
            helperText={t("dashboard.stats.modules.helper", {
              ready: readyModuleCount,
              planned: plannedModuleCount,
            })}
          />
          <StatCard
            icon={SecurityIcon}
            tone="success"
            label={t("dashboard.stats.scopes.label")}
            value={session.scopes.length}
            helperText={t("dashboard.stats.scopes.helper")}
          />
          <StatCard
            icon={AccessTimeIcon}
            tone="warning"
            label={t("dashboard.stats.session.label")}
            value={`${security.authentication.accessTokenTtlMinutes} ${t("common.minutes")}`}
            helperText={security.authentication.refreshTokenStorage}
          />
          <StatCard
            icon={VerifiedUserIcon}
            tone="info"
            label={t("dashboard.stats.roles.label")}
            value={session.user.roles.length}
            helperText={
              session.user.roles.length > 0
                ? session.user.roles.join(", ")
                : t("dashboard.stats.roles.helperEmpty")
            }
          />
        </section>

        <section className="charts-row">
          <DashboardCard
            icon={BarChartIcon}
            tone="info"
            title={t("dashboard.charts.moduleStatus.title")}
            description={t("dashboard.charts.moduleStatus.description")}
          >
            <ModuleStatusChart
              readyCount={readyModuleCount}
              plannedCount={plannedModuleCount}
              readyLabel={t("status.ready")}
              plannedLabel={t("status.planned")}
            />
          </DashboardCard>

          <DashboardCard
            icon={ShowChartIcon}
            tone="primary"
            title={t("dashboard.charts.activity.title")}
            description={t("dashboard.charts.activity.description")}
          >
            <MiniAreaChart
              points={sessionActivitySample}
              gradientId="dashboard-activity-gradient"
              stroke="#38bdf8"
              fill="#38bdf8"
            />
          </DashboardCard>
        </section>

        <section className="content-grid">
          <DashboardCard
            icon={SecurityIcon}
            tone="success"
            title={t("dashboard.security.title")}
            description={
              <>
                {t("dashboard.security.authProvider")}{" "}
                <strong>{security.authentication.provider}</strong> ·{" "}
                {t("dashboard.security.accessTokenTtl")}{" "}
                <strong>
                  {security.authentication.accessTokenTtlMinutes}{" "}
                  {t("common.minutes")}
                </strong>{" "}
                · {t("dashboard.security.refreshToken")}{" "}
                <strong>{security.authentication.refreshTokenStorage}</strong>
              </>
            }
            fullWidth
          >
            <ul className="rules-list">
              <li>
                {t("dashboard.security.signedInAs")}{" "}
                <code>{session.user.email}</code>{" "}
                {t("dashboard.security.withRoles")}{" "}
                <code>
                  {session.user.roles.length > 0
                    ? session.user.roles.join(", ")
                    : t("dashboard.sidenav.noRoles")}
                </code>
              </li>
              <li>
                {t("dashboard.security.authorizationModel")}{" "}
                <code>{security.authorization.model}</code>
              </li>
              <li>
                {t("dashboard.security.inventoryWritePermission")}{" "}
                <strong>
                  {canManageInventory
                    ? t("common.permissionGranted")
                    : t("common.permissionDenied")}
                </strong>{" "}
                {t("dashboard.security.rbacAbac")}
              </li>
            </ul>
          </DashboardCard>

          <DashboardCard
            icon={AppsIcon}
            tone="primary"
            title={t("dashboard.featureModules.title")}
            description={t("dashboard.featureModules.description")}
            fullWidth
          >
            <div className="card-grid">
              {modules.map((module) => (
                <FeatureCard key={module.id} module={module} />
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            icon={TableChartIcon}
            tone="primary"
            title={t("dashboard.grid.title")}
            description={t("dashboard.grid.description")}
            fullWidth
          >
            <Grid<FeatureModule>
              columns={featureModuleColumns}
              defaultData={modules}
              getRowKey={(module) => module.id}
              createRow={createModule}
              onAddRow={handleModuleAdded}
              addRowLabel={t("dashboard.grid.actions.add")}
              enableEditing
              onSaveRow={handleSaveModule}
              editRowLabel={t("dashboard.grid.actions.edit")}
              saveRowLabel={t("dashboard.grid.actions.save")}
              cancelEditLabel={t("dashboard.grid.actions.cancelForm")}
              enableDeleting
              onDeleteRow={handleDeleteModule}
              deleteRowLabel={t("dashboard.grid.actions.delete")}
              actionsHeader={t("dashboard.grid.actions.header")}
              getDeleteConfirmMessage={(module) =>
                t("dashboard.grid.actions.confirmDelete", {
                  name: module.name,
                })
              }
            />
          </DashboardCard>

          <DashboardCard
            icon={BarChartIcon}
            tone="warning"
            title={t("dashboard.inventory.title")}
            description={t("dashboard.inventory.description")}
            fullWidth
          >
            <InventoryDashboardPage />
          </DashboardCard>

          <DashboardCard
            icon={VerifiedUserIcon}
            tone="success"
            title={t("dashboard.rules.title")}
          >
            <ul className="rules-list">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </DashboardCard>
          <DashboardCard
            icon={AppsIcon}
            tone="info"
            title={t("dashboard.snapshot.title")}
            description={t("dashboard.snapshot.description")}
          >
            <ul className="module-list">
              {[
                dashboardModule,
                financialModule,
                inventoryModule,
                crmModule,
              ].map((module) => (
                <li key={module.id}>
                  <strong>
                    {t(`modules.${module.id}.name`, {
                      defaultValue: module.name,
                    })}
                  </strong>
                  <span>
                    {t(`modules.${module.id}.description`, {
                      defaultValue: module.description,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </section>
      </main>
    </div>
  );
}
