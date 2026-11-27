import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ConfirmActionDialog, Grid } from "@/components";
import type { GridColumn } from "@/components";
import { useAppContext } from "@/context";
import { DepartmentFormDialog } from "@/features/organization/components/DepartmentFormDialog";
import { DepartmentTree } from "@/features/organization/components/DepartmentTree";
import { MoveDepartmentDialog } from "@/features/organization/components/MoveDepartmentDialog";
import { OrganizationFormDialog } from "@/features/organization/components/OrganizationFormDialog";
import { OrgMemberRoster } from "@/features/organization/components/OrgMemberRoster";
import { useDepartmentTree } from "@/features/organization/hooks/useDepartmentTree";
import { useOrganizationMutations } from "@/features/organization/hooks/useOrganizationMutations";
import { useOrganizationsQuery } from "@/features/organization/hooks/useOrganizationsQuery";
import type {
  DepartmentNode,
  OrganizationSummary,
} from "@/features/organization/types";
import { isAuthorized, organizationWritePolicy } from "@/services";

import "./OrganizationManagementPage.css";

const listPageSize = 10;

type StatusFilter = "" | "active" | "inactive";

type OrgDialogState = "create" | "edit" | null;

type DeptDialogState =
  | { readonly mode: "create"; readonly parentId: string | null }
  | { readonly mode: "rename"; readonly node: DepartmentNode }
  | null;

type ConfirmState =
  | { readonly kind: "org-active"; readonly nextActive: boolean }
  | { readonly kind: "dept-deactivate"; readonly node: DepartmentNode }
  | null;

export function OrganizationManagementPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const canManage = isAuthorized(session, organizationWritePolicy);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationSummary | null>(
    null,
  );
  const [orgDialog, setOrgDialog] = useState<OrgDialogState>(null);
  const [deptDialog, setDeptDialog] = useState<DeptDialogState>(null);
  const [moveTarget, setMoveTarget] = useState<DepartmentNode | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const {
    data,
    isLoading,
    error: listError,
    refetch,
    version: listVersion,
  } = useOrganizationsQuery({
    search: appliedSearch || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: listPageSize,
  });

  // The clicked summary can go stale after a refetch; prefer the fresh row.
  const currentOrg =
    data?.items.find((item) => item.id === selectedOrg?.id) ?? selectedOrg;

  const {
    tree,
    isLoading: isTreeLoading,
    error: treeError,
    refetch: refetchTree,
  } = useDepartmentTree(currentOrg?.id ?? null);

  const mutations = useOrganizationMutations();

  const columns = useMemo<ReadonlyArray<GridColumn<OrganizationSummary>>>(
    () => [
      {
        key: "name",
        header: t("organizationPage.grid.columns.name"),
        accessor: "name",
      },
      {
        key: "region",
        header: t("organizationPage.grid.columns.region"),
        accessor: "region",
      },
      {
        key: "departments",
        header: t("organizationPage.grid.columns.departments"),
        accessor: "departmentCount",
        align: "right",
        width: "8rem",
      },
      {
        key: "members",
        header: t("organizationPage.grid.columns.members"),
        accessor: "memberCount",
        align: "right",
        width: "8rem",
      },
      {
        key: "status",
        header: t("organizationPage.grid.columns.status"),
        align: "center",
        width: "8rem",
        render: (organization) => (
          <Chip
            size="small"
            color={organization.isActive ? "success" : "default"}
            variant="outlined"
            label={
              organization.isActive
                ? t("organizationPage.status.active")
                : t("organizationPage.status.inactive")
            }
          />
        ),
      },
    ],
    [t],
  );

  const pageCount = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
  }

  async function handleSaveOrganization(request: {
    name: string;
    region: string;
  }) {
    const succeeded =
      orgDialog === "edit" && currentOrg
        ? await mutations.updateOrganization(currentOrg.id, request)
        : await mutations.createOrganization(request);

    if (succeeded) {
      setOrgDialog(null);
      refetch();
    }
  }

  async function handleSaveDepartment(name: string) {
    if (!currentOrg || !deptDialog) {
      return;
    }

    const succeeded =
      deptDialog.mode === "create"
        ? await mutations.createDepartment(currentOrg.id, {
            name,
            parentId: deptDialog.parentId ?? undefined,
          })
        : await mutations.updateDepartment(currentOrg.id, deptDialog.node.id, {
            name,
          });

    if (succeeded) {
      setDeptDialog(null);
      refetchTree();
      refetch();
    }
  }

  async function handleMoveDepartment(parentId: string | null) {
    if (!currentOrg || !moveTarget) {
      return;
    }

    const succeeded = await mutations.updateDepartment(
      currentOrg.id,
      moveTarget.id,
      { parentId },
    );

    if (succeeded) {
      setMoveTarget(null);
      refetchTree();
    }
  }

  async function handleConfirm() {
    if (!currentOrg || !confirmState) {
      return;
    }

    const succeeded =
      confirmState.kind === "org-active"
        ? await mutations.setOrganizationActive(
            currentOrg.id,
            confirmState.nextActive,
          )
        : await mutations.deactivateDepartment(
            currentOrg.id,
            confirmState.node.id,
          );

    if (succeeded) {
      setConfirmState(null);
      refetch();
      refetchTree();
    }
  }

  return (
    <main className="organization-page">
      <div className="organization-page__header">
        <Link className="organization-page__back-link" to="/">
          {t("organizationPage.backToDashboard")}
        </Link>
        <p className="organization-page__eyebrow">
          {t("organizationPage.eyebrow")}
        </p>
        <h1>{t("organizationPage.title")}</h1>
        <p className="organization-page__description">
          {t("organizationPage.description")}
        </p>
      </div>

      {mutations.error ? (
        <Alert severity="error" onClose={mutations.clearError}>
          {mutations.error}
        </Alert>
      ) : null}

      <div className="organization-page__content">
        <section
          className="organization-page__panel"
          aria-label={t("organizationPage.grid.ariaLabel")}
        >
          <Box
            component="form"
            onSubmit={applySearch}
            sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
          >
            <TextField
              size="small"
              label={t("organizationPage.filters.search")}
              placeholder={t("organizationPage.filters.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
            />
            <TextField
              select
              size="small"
              sx={{ minWidth: 150 }}
              label={t("organizationPage.filters.status")}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <MenuItem value="">
                {t("organizationPage.filters.statusAll")}
              </MenuItem>
              <MenuItem value="active">
                {t("organizationPage.status.active")}
              </MenuItem>
              <MenuItem value="inactive">
                {t("organizationPage.status.inactive")}
              </MenuItem>
            </TextField>
            <Button type="submit" variant="outlined" size="small">
              {t("organizationPage.filters.apply")}
            </Button>
            {canManage ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ ml: "auto" }}
                onClick={() => {
                  setOrgDialog("create");
                }}
              >
                {t("organizationPage.actions.newOrganization")}
              </Button>
            ) : null}
          </Box>

          {listError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={refetch}>
                  {t("common.retry")}
                </Button>
              }
            >
              {t("organizationPage.errors.loadFailed")}
            </Alert>
          ) : null}

          <Grid<OrganizationSummary>
            key={`organizations-${listVersion}`}
            columns={columns}
            defaultData={data?.items ?? []}
            getRowKey={(organization) => organization.id}
            isLoading={isLoading}
            loadingMessage={t("organizationPage.grid.loading")}
            emptyMessage={t("organizationPage.grid.empty")}
            onRowClick={(organization) => {
              setSelectedOrg(organization);
            }}
            rowClassName={(organization) =>
              organization.id === currentOrg?.id
                ? "organization-page__row--selected"
                : undefined
            }
          />

          {pageCount > 1 ? (
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_event, nextPage) => {
                setPage(nextPage);
              }}
            />
          ) : null}
        </section>

        <section
          className="organization-page__panel"
          aria-label={t("organizationPage.detail.ariaLabel")}
          aria-live="polite"
        >
          {!currentOrg ? (
            <Typography variant="body2" color="text.secondary">
              {t("organizationPage.detail.selectPrompt")}
            </Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" component="h2">
                  {currentOrg.name}
                </Typography>
                <Chip
                  size="small"
                  color={currentOrg.isActive ? "success" : "default"}
                  variant="outlined"
                  label={
                    currentOrg.isActive
                      ? t("organizationPage.status.active")
                      : t("organizationPage.status.inactive")
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                  {currentOrg.region}
                </Typography>
              </Box>

              {canManage ? (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setOrgDialog("edit");
                    }}
                  >
                    {t("organizationPage.actions.edit")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color={currentOrg.isActive ? "error" : "success"}
                    onClick={() => {
                      setConfirmState({
                        kind: "org-active",
                        nextActive: !currentOrg.isActive,
                      });
                    }}
                  >
                    {currentOrg.isActive
                      ? t("organizationPage.actions.deactivate")
                      : t("organizationPage.actions.activate")}
                  </Button>
                </Box>
              ) : null}

              <Divider />

              <Typography variant="subtitle1" component="h3">
                {t("organizationPage.detail.departmentsTitle")}
              </Typography>

              {treeError ? <Alert severity="error">{treeError}</Alert> : null}

              {isTreeLoading ? (
                <Box aria-busy="true">
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                </Box>
              ) : (
                <DepartmentTree
                  tree={tree}
                  canManage={canManage}
                  onAddChild={(parentId) => {
                    setDeptDialog({ mode: "create", parentId });
                  }}
                  onRename={(node) => {
                    setDeptDialog({ mode: "rename", node });
                  }}
                  onMove={(node) => {
                    setMoveTarget(node);
                  }}
                  onDeactivate={(node) => {
                    setConfirmState({ kind: "dept-deactivate", node });
                  }}
                />
              )}

              <Divider />

              <Typography variant="subtitle1" component="h3">
                {t("organizationPage.detail.membersTitle")}
              </Typography>

              <OrgMemberRoster organizationId={currentOrg.id} tree={tree} />
            </>
          )}
        </section>
      </div>

      {orgDialog !== null ? (
        <OrganizationFormDialog
          open
          title={
            orgDialog === "edit"
              ? t("organizationPage.dialogs.editOrganization")
              : t("organizationPage.dialogs.newOrganization")
          }
          initialValues={
            orgDialog === "edit" && currentOrg
              ? { name: currentOrg.name, region: currentOrg.region }
              : undefined
          }
          isBusy={mutations.isBusy}
          onSubmit={handleSaveOrganization}
          onCancel={() => {
            setOrgDialog(null);
          }}
        />
      ) : null}

      {deptDialog !== null ? (
        <DepartmentFormDialog
          open
          title={
            deptDialog.mode === "rename"
              ? t("organizationPage.dialogs.renameDepartment")
              : t("organizationPage.dialogs.newDepartment")
          }
          initialName={deptDialog.mode === "rename" ? deptDialog.node.name : ""}
          isBusy={mutations.isBusy}
          onSubmit={handleSaveDepartment}
          onCancel={() => {
            setDeptDialog(null);
          }}
        />
      ) : null}

      {moveTarget !== null ? (
        <MoveDepartmentDialog
          open
          department={moveTarget}
          tree={tree}
          isBusy={mutations.isBusy}
          onMove={handleMoveDepartment}
          onCancel={() => {
            setMoveTarget(null);
          }}
        />
      ) : null}

      <ConfirmActionDialog
        open={confirmState !== null}
        title={
          confirmState?.kind === "dept-deactivate"
            ? t("organizationPage.confirm.deactivateDeptTitle")
            : confirmState?.nextActive
              ? t("organizationPage.confirm.activateOrgTitle")
              : t("organizationPage.confirm.deactivateOrgTitle")
        }
        message={
          confirmState?.kind === "dept-deactivate"
            ? t("organizationPage.confirm.deactivateDeptMessage", {
                name: confirmState.node.name,
              })
            : confirmState?.nextActive
              ? t("organizationPage.confirm.activateOrgMessage", {
                  name: currentOrg?.name ?? "",
                })
              : t("organizationPage.confirm.deactivateOrgMessage", {
                  name: currentOrg?.name ?? "",
                })
        }
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        destructive={
          confirmState?.kind === "dept-deactivate" ||
          confirmState?.nextActive === false
        }
        isBusy={mutations.isBusy}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmState(null);
        }}
      />
    </main>
  );
}
