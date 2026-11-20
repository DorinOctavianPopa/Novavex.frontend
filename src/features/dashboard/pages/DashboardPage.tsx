import { FeatureCard, Grid } from "@/components";
import type { GridColumn } from "@/components";
import { useAppContext } from "@/context";
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

  function handleAddModule() {
    const name = t("dashboard.grid.actions.newModuleName");
    const id = createModuleId(name, modules);
    const newModule: FeatureModule = {
      id,
      name,
      description: "",
      path: `src/features/${id}`,
      status: "planned",
      alias: name.slice(0, 3).toUpperCase(),
    };
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

  return (
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

      <section className="content-grid">
        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t("dashboard.security.title")}</h2>
            <p>
              {t("dashboard.security.authProvider")}{" "}
              <strong>{security.authentication.provider}</strong> ·{" "}
              {t("dashboard.security.accessTokenTtl")}{" "}
              <strong>
                {security.authentication.accessTokenTtlMinutes}{" "}
                {t("common.minutes")}
              </strong>{" "}
              · {t("dashboard.security.refreshToken")}{" "}
              <strong>{security.authentication.refreshTokenStorage}</strong>
            </p>
          </div>
          <ul className="rules-list">
            <li>
              {t("dashboard.security.signedInAs")}{" "}
              <code>{session.user.email}</code>{" "}
              {t("dashboard.security.withRoles")}{" "}
              <code>{session.user.roles.join(", ")}</code>
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
        </article>

        {/* <article className="panel">
          <div className="panel__header">
            <h2>{t('dashboard.layout.title')}</h2>
            <p>{t('dashboard.layout.description')}</p>
          </div>
          <div className="directory-list">
            {directoryBlueprint.map((node) => (
              <div key={node.name} className="directory-list__item">
                <code>{formatDirectoryName(node.name)}</code>
                <p>{t(`directory.${node.name.replace('/', '')}`)}</p>
              </div>
            ))}
          </div>
        </article>*/}

        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t("dashboard.featureModules.title")}</h2>
            <p>{t("dashboard.featureModules.description")}</p>
          </div>
          <div className="card-grid">
            {modules.map((module) => (
              <FeatureCard key={module.id} module={module} />
            ))}
          </div>
        </article>

        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t("dashboard.grid.title")}</h2>
            <p>{t("dashboard.grid.description")}</p>
          </div>
          <Grid<FeatureModule>
            columns={featureModuleColumns}
            data={modules}
            getRowKey={(module) => module.id}
            onAddRow={handleAddModule}
            addRowLabel={t("dashboard.grid.actions.add")}
            onSaveRow={handleSaveModule}
            editRowLabel={t("dashboard.grid.actions.edit")}
            saveRowLabel={t("dashboard.grid.actions.save")}
            cancelEditLabel={t("dashboard.grid.actions.cancelForm")}
            onDeleteRow={handleDeleteModule}
            deleteRowLabel={t("dashboard.grid.actions.delete")}
            actionsHeader={t("dashboard.grid.actions.header")}
            getDeleteConfirmMessage={(module) =>
              t("dashboard.grid.actions.confirmDelete", { name: module.name })
            }
          />
        </article>

        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t("dashboard.inventory.title")}</h2>
            <p>{t("dashboard.inventory.description")}</p>
          </div>
          <InventoryDashboardPage />
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.rules.title")}</h2>
          </div>
          <ul className="rules-list">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>{t("dashboard.snapshot.title")}</h2>
            <p>{t("dashboard.snapshot.description")}</p>
          </div>
          <ul className="module-list">
            {[dashboardModule, financialModule, inventoryModule, crmModule].map(
              (module) => (
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
              ),
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}
