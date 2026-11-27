import { useMemo, useState } from "react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Grid } from "@/components";
import type { GridColumn } from "@/components";
import { useAppContext } from "@/context";
import { useOrganizationsQuery } from "@/features/organization/hooks/useOrganizationsQuery";
import { InviteUserDialog } from "@/features/userManagement/components/InviteUserDialog";
import { UserDetailDrawer } from "@/features/userManagement/components/UserDetailDrawer";
import { UserStatusChip } from "@/features/userManagement/components/UserStatusChip";
import { useUserMutations } from "@/features/userManagement/hooks/useUserMutations";
import { useUsersQuery } from "@/features/userManagement/hooks/useUsersQuery";
import { authRoles } from "@/features/userManagement/types";
import type {
  InviteUserRequest,
  ManagedUserStatus,
  ManagedUserSummary,
} from "@/features/userManagement/types";
import { isAuthorized, userManagementWritePolicy } from "@/services";
import type { AuthRole } from "@/types";

import "./UserManagementPage.css";

const listPageSize = 10;
const userStatuses: readonly ManagedUserStatus[] = [
  "active",
  "inactive",
  "locked",
  "invited",
];

export function UserManagementPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const canWrite = isAuthorized(session, userManagementWritePolicy);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | AuthRole>("");
  const [statusFilter, setStatusFilter] = useState<"" | ManagedUserStatus>("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const { data, isLoading, error, refetch, version: listVersion } = useUsersQuery({
    search: appliedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: listPageSize,
  });

  // Shared by the invite dialog and the detail drawer's memberships editor.
  const organizationsQuery = useOrganizationsQuery({ page: 1, pageSize: 100 });
  const organizations = organizationsQuery.data?.items ?? [];

  const mutations = useUserMutations();

  const columns = useMemo<ReadonlyArray<GridColumn<ManagedUserSummary>>>(
    () => [
      {
        key: "email",
        header: t("userManagementPage.grid.columns.email"),
        accessor: "email",
      },
      {
        key: "name",
        header: t("userManagementPage.grid.columns.name"),
        accessor: "fullName",
      },
      {
        key: "roles",
        header: t("userManagementPage.grid.columns.roles"),
        render: (user) => (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {user.roles.map((role) => (
              <Chip key={role} size="small" label={t(`roles.${role}`)} />
            ))}
          </Box>
        ),
      },
      {
        key: "status",
        header: t("userManagementPage.grid.columns.status"),
        align: "center",
        width: "7rem",
        render: (user) => <UserStatusChip status={user.status} />,
      },
      {
        key: "organization",
        header: t("userManagementPage.grid.columns.organization"),
        render: (user) => user.primaryOrganizationName ?? "—",
      },
      {
        key: "departments",
        header: t("userManagementPage.grid.columns.departments"),
        render: (user) =>
          user.departmentNames.length > 0 ? user.departmentNames.join(", ") : "—",
      },
      {
        key: "lastSignIn",
        header: t("userManagementPage.grid.columns.lastSignIn"),
        width: "11rem",
        render: (user) =>
          user.lastSignInAt
            ? new Date(user.lastSignInAt).toLocaleString()
            : t("userManagementPage.grid.never"),
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

  async function handleInvite(request: InviteUserRequest) {
    const succeeded = await mutations.invite(request);

    if (succeeded) {
      setIsInviteOpen(false);
      setInviteNotice(
        t("userManagementPage.invite.success", { email: request.email }),
      );
      refetch();
    }
  }

  return (
    <main className="user-management-page">
      <div className="user-management-page__header">
        <Link className="user-management-page__back-link" to="/">
          {t("userManagementPage.backToDashboard")}
        </Link>
        <p className="user-management-page__eyebrow">
          {t("userManagementPage.eyebrow")}
        </p>
        <h1>{t("userManagementPage.title")}</h1>
        <p className="user-management-page__description">
          {t("userManagementPage.description")}
        </p>
      </div>

      {mutations.error ? (
        <Alert severity="error" onClose={mutations.clearError}>
          {mutations.error}
        </Alert>
      ) : null}
      {inviteNotice ? (
        <Alert
          severity="success"
          onClose={() => {
            setInviteNotice(null);
          }}
        >
          {inviteNotice}
        </Alert>
      ) : null}

      <section
        className="user-management-page__panel"
        aria-label={t("userManagementPage.grid.ariaLabel")}
      >
        <Box
          component="form"
          onSubmit={applySearch}
          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
        >
          <TextField
            size="small"
            label={t("userManagementPage.filters.search")}
            placeholder={t("userManagementPage.filters.searchPlaceholder")}
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
          />
          <TextField
            select
            size="small"
            sx={{ minWidth: 170 }}
            label={t("userManagementPage.filters.role")}
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as "" | AuthRole);
              setPage(1);
            }}
          >
            <MenuItem value="">{t("userManagementPage.filters.roleAll")}</MenuItem>
            {authRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {t(`roles.${role}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            sx={{ minWidth: 150 }}
            label={t("userManagementPage.filters.status")}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "" | ManagedUserStatus);
              setPage(1);
            }}
          >
            <MenuItem value="">
              {t("userManagementPage.filters.statusAll")}
            </MenuItem>
            {userStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`userManagementPage.status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="outlined" size="small">
            {t("userManagementPage.filters.apply")}
          </Button>
          {canWrite ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              sx={{ ml: "auto" }}
              onClick={() => {
                setIsInviteOpen(true);
              }}
            >
              {t("userManagementPage.actions.inviteUser")}
            </Button>
          ) : null}
        </Box>

        {error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refetch}>
                {t("common.retry")}
              </Button>
            }
          >
            {t("userManagementPage.errors.loadFailed")}
          </Alert>
        ) : null}

        <Grid<ManagedUserSummary>
          key={`users-${listVersion}`}
          columns={columns}
          defaultData={data?.items ?? []}
          getRowKey={(user) => user.id}
          isLoading={isLoading}
          loadingMessage={t("userManagementPage.grid.loading")}
          emptyMessage={t("userManagementPage.grid.empty")}
          onRowClick={(user) => {
            setSelectedUserId(user.id);
            setIsDrawerOpen(true);
          }}
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

      <UserDetailDrawer
        userId={selectedUserId}
        open={isDrawerOpen}
        organizations={organizations}
        onClose={() => {
          setIsDrawerOpen(false);
        }}
        onChanged={refetch}
      />

      {isInviteOpen ? (
        <InviteUserDialog
          open
          organizations={organizations}
          isBusy={mutations.isBusy}
          onSubmit={handleInvite}
          onCancel={() => {
            setIsInviteOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}
