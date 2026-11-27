import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

import { ConfirmActionDialog } from "@/components";
import { useAppContext } from "@/context";
import type { OrganizationSummary } from "@/features/organization";
import { MembershipsEditor } from "@/features/userManagement/components/MembershipsEditor";
import { UserStatusChip } from "@/features/userManagement/components/UserStatusChip";
import { useScopeCatalog } from "@/features/userManagement/hooks/useScopeCatalog";
import { useUserAudit } from "@/features/userManagement/hooks/useUserAudit";
import { useUserDetail } from "@/features/userManagement/hooks/useUserDetail";
import { useUserMutations } from "@/features/userManagement/hooks/useUserMutations";
import { authRoles } from "@/features/userManagement/types";
import type {
  ManagedUserDetail,
  MembershipInput,
  ScopeDefinition,
} from "@/features/userManagement/types";
import {
  isAuthorized,
  userManagementAdminPolicy,
  userManagementWritePolicy,
} from "@/services";
import type { AuthRole } from "@/types";

type ConfirmKind = "deactivate" | "revoke-sessions" | null;

type UserMutations = ReturnType<typeof useUserMutations>;

export interface UserDetailDrawerProps {
  readonly userId: string | null;
  readonly open: boolean;
  readonly organizations: readonly OrganizationSummary[];
  readonly onClose: () => void;
  /** Called after any successful mutation so the list page can refetch. */
  readonly onChanged: () => void;
}

function formatDate(value: string | null, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export function UserDetailDrawer({
  userId,
  open,
  organizations,
  onClose,
  onChanged,
}: UserDetailDrawerProps) {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const canWrite = isAuthorized(session, userManagementWritePolicy);
  const canAdmin = isAuthorized(session, userManagementAdminPolicy);

  const { detail, isLoading, error, refetch, version } = useUserDetail(
    open ? userId : null,
  );
  const mutations = useUserMutations();
  const scopeCatalog = useScopeCatalog(open && canWrite);

  const [notice, setNotice] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);

  const isSelf = session?.user.id === detail?.id;

  async function completeMutation(succeeded: boolean, message: string) {
    if (succeeded) {
      setNotice(message);
      refetch();
      onChanged();
    }
  }

  function handleClose() {
    setNotice(null);
    onClose();
  }

  async function handleConfirm() {
    if (!detail || !confirmKind) {
      return;
    }

    if (confirmKind === "deactivate") {
      const succeeded = await mutations.setActive(detail.id, false);
      setConfirmKind(null);
      await completeMutation(
        succeeded,
        t("userManagementPage.drawer.status.deactivated"),
      );
      return;
    }

    const succeeded = await mutations.revokeSessions(detail.id);
    setConfirmKind(null);
    await completeMutation(
      succeeded,
      t("userManagementPage.drawer.status.sessionsRevoked"),
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 } } } }}
    >
      <Box
        sx={{ p: 2.5, display: "grid", gap: 1.5, alignContent: "start" }}
        role="region"
        aria-label={t("userManagementPage.drawer.ariaLabel")}
        aria-live="polite"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" component="h2" sx={{ mr: "auto" }}>
            {detail?.fullName ?? t("userManagementPage.drawer.loading")}
          </Typography>
          {detail ? <UserStatusChip status={detail.status} /> : null}
          <IconButton onClick={handleClose} aria-label={t("common.close")}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {mutations.error ? (
          <Alert severity="error" onClose={mutations.clearError}>
            {mutations.error}
          </Alert>
        ) : null}
        {notice ? (
          <Alert
            severity="success"
            onClose={() => {
              setNotice(null);
            }}
          >
            {notice}
          </Alert>
        ) : null}

        {isLoading ? (
          <Box aria-busy="true">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Box>
        ) : null}

        {detail ? (
          // Keyed by detail version: each (re-)fetch remounts the sections so
          // the editable drafts re-seed from the fresh server state.
          <UserDetailSections
            key={`${detail.id}-${version}`}
            detail={detail}
            canWrite={canWrite}
            canAdmin={canAdmin}
            isSelf={isSelf}
            organizations={organizations}
            scopes={scopeCatalog.scopes}
            mutations={mutations}
            onMutated={completeMutation}
            onRequestConfirm={setConfirmKind}
          />
        ) : null}
      </Box>

      <ConfirmActionDialog
        open={confirmKind !== null}
        title={
          confirmKind === "revoke-sessions"
            ? t("userManagementPage.confirm.revokeTitle")
            : t("userManagementPage.confirm.deactivateTitle")
        }
        message={
          confirmKind === "revoke-sessions"
            ? t("userManagementPage.confirm.revokeMessage", {
                name: detail?.fullName ?? "",
              })
            : t("userManagementPage.confirm.deactivateMessage", {
                name: detail?.fullName ?? "",
              })
        }
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        destructive
        isBusy={mutations.isBusy}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmKind(null);
        }}
      />
    </Drawer>
  );
}

function UserDetailSections({
  detail,
  canWrite,
  canAdmin,
  isSelf,
  organizations,
  scopes,
  mutations,
  onMutated,
  onRequestConfirm,
}: Readonly<{
  detail: ManagedUserDetail;
  canWrite: boolean;
  canAdmin: boolean;
  isSelf: boolean;
  organizations: readonly OrganizationSummary[];
  scopes: readonly ScopeDefinition[];
  mutations: UserMutations;
  onMutated: (succeeded: boolean, message: string) => Promise<void>;
  onRequestConfirm: (kind: ConfirmKind) => void;
}>) {
  const { t } = useTranslation();

  const [rolesDraft, setRolesDraft] = useState<readonly AuthRole[]>(
    detail.roles,
  );
  const [regionDraft, setRegionDraft] = useState(detail.region);
  const [clearanceDraft, setClearanceDraft] = useState(detail.clearanceLevel);
  const [scopesDraft, setScopesDraft] = useState<readonly string[]>(
    detail.scopeOverrides,
  );
  const [membershipsDraft, setMembershipsDraft] = useState<
    readonly MembershipInput[]
  >(() =>
    detail.memberships.map((membership) => ({
      organizationId: membership.organizationId,
      isPrimary: membership.isPrimary,
      departmentIds: membership.departments.map((department) => department.id),
    })),
  );
  const [auditPage, setAuditPage] = useState(1);
  const audit = useUserAudit(detail.id, auditPage);

  const auditPageCount = audit.data
    ? Math.ceil(audit.data.totalCount / audit.data.pageSize)
    : 0;

  return (
    <>
      {/* Identity */}
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.identity.title")}
      </Typography>
      <Box sx={{ display: "grid", gap: 0.5 }}>
        <Typography variant="body2">
          <strong>{t("userManagementPage.drawer.identity.email")}:</strong>{" "}
          {detail.email}
        </Typography>
        <Typography variant="body2">
          <strong>{t("userManagementPage.drawer.identity.created")}:</strong>{" "}
          {formatDate(detail.createdAt, "—")}
        </Typography>
        <Typography variant="body2">
          <strong>
            {t("userManagementPage.drawer.identity.emailVerified")}:
          </strong>{" "}
          {formatDate(
            detail.emailVerifiedAt,
            t("userManagementPage.drawer.identity.notVerified"),
          )}
        </Typography>
        <Typography variant="body2">
          <strong>{t("userManagementPage.drawer.identity.lastSignIn")}:</strong>{" "}
          {formatDate(
            detail.lastSignInAt,
            t("userManagementPage.drawer.identity.never"),
          )}
        </Typography>
        <Typography variant="body2">
          <strong>
            {t("userManagementPage.drawer.status.activeSessions")}:
          </strong>{" "}
          {detail.activeSessionCount}
        </Typography>
      </Box>

      {/* Account actions */}
      {canWrite || canAdmin ? (
        <>
          <Divider />
          <Typography variant="subtitle1" component="h3">
            {t("userManagementPage.drawer.status.title")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {canAdmin ? (
              detail.status === "inactive" ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  disabled={mutations.isBusy}
                  onClick={async () => {
                    await onMutated(
                      await mutations.setActive(detail.id, true),
                      t("userManagementPage.drawer.status.activated"),
                    );
                  }}
                >
                  {t("userManagementPage.drawer.status.activate")}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={mutations.isBusy || isSelf}
                  onClick={() => {
                    onRequestConfirm("deactivate");
                  }}
                >
                  {t("userManagementPage.drawer.status.deactivate")}
                </Button>
              )
            ) : null}
            {canAdmin && detail.status === "locked" ? (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                disabled={mutations.isBusy}
                onClick={async () => {
                  await onMutated(
                    await mutations.unlock(detail.id),
                    t("userManagementPage.drawer.status.unlocked"),
                  );
                }}
              >
                {t("userManagementPage.drawer.status.unlock")}
              </Button>
            ) : null}
            {canWrite ? (
              <Button
                size="small"
                variant="outlined"
                disabled={mutations.isBusy}
                onClick={async () => {
                  await onMutated(
                    await mutations.sendPasswordReset(detail.id),
                    t("userManagementPage.drawer.status.resetSent"),
                  );
                }}
              >
                {t("userManagementPage.drawer.status.sendReset")}
              </Button>
            ) : null}
            {canAdmin ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={mutations.isBusy}
                onClick={() => {
                  onRequestConfirm("revoke-sessions");
                }}
              >
                {t("userManagementPage.drawer.status.revokeSessions")}
              </Button>
            ) : null}
          </Box>
        </>
      ) : null}

      {/* Roles */}
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.roles.title")}
      </Typography>
      <Box sx={{ display: "grid", gap: 0 }}>
        {authRoles.map((role) => (
          <FormControlLabel
            key={role}
            control={
              <Checkbox
                size="small"
                checked={rolesDraft.includes(role)}
                disabled={
                  !canWrite ||
                  mutations.isBusy ||
                  // Self-demotion guard: an admin cannot drop their own super_admin role.
                  (role === "super_admin" && isSelf)
                }
                onChange={(event) => {
                  setRolesDraft(
                    event.target.checked
                      ? [...rolesDraft, role]
                      : rolesDraft.filter((entry) => entry !== role),
                  );
                }}
              />
            }
            label={t(`roles.${role}`)}
          />
        ))}
      </Box>
      {canWrite ? (
        <>
          <Typography variant="caption" color="text.secondary">
            {t("userManagementPage.drawer.roles.refreshHint")}
          </Typography>
          <Button
            size="small"
            variant="contained"
            sx={{ justifySelf: "start" }}
            disabled={mutations.isBusy}
            onClick={async () => {
              await onMutated(
                await mutations.updateRoles(detail.id, rolesDraft),
                t("userManagementPage.drawer.roles.saved"),
              );
            }}
          >
            {t("common.save")}
          </Button>
        </>
      ) : null}

      {/* Attributes */}
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.attributes.title")}
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label={t("userManagementPage.drawer.attributes.region")}
          value={regionDraft}
          disabled={!canWrite || mutations.isBusy}
          onChange={(event) => {
            setRegionDraft(event.target.value);
          }}
        />
        <TextField
          select
          size="small"
          sx={{ minWidth: 140 }}
          label={t("userManagementPage.drawer.attributes.clearance")}
          value={clearanceDraft}
          disabled={!canWrite || mutations.isBusy}
          onChange={(event) => {
            setClearanceDraft(Number(event.target.value));
          }}
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      {canWrite ? (
        <Button
          size="small"
          variant="contained"
          sx={{ justifySelf: "start" }}
          disabled={mutations.isBusy}
          onClick={async () => {
            await onMutated(
              await mutations.updateAttributes(detail.id, {
                region: regionDraft.trim(),
                clearanceLevel: clearanceDraft,
              }),
              t("userManagementPage.drawer.attributes.saved"),
            );
          }}
        >
          {t("common.save")}
        </Button>
      ) : null}

      {/* Organizations & departments */}
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.memberships.title")}
      </Typography>
      <MembershipsEditor
        value={membershipsDraft}
        onChange={setMembershipsDraft}
        organizations={organizations}
        disabled={!canWrite || mutations.isBusy}
      />
      {canWrite ? (
        <>
          {membershipsDraft.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t("userManagementPage.drawer.memberships.lastMembershipHint")}
            </Typography>
          ) : null}
          <Button
            size="small"
            variant="contained"
            sx={{ justifySelf: "start" }}
            disabled={mutations.isBusy || membershipsDraft.length === 0}
            onClick={async () => {
              await onMutated(
                await mutations.updateMemberships(detail.id, membershipsDraft),
                t("userManagementPage.drawer.memberships.saved"),
              );
            }}
          >
            {t("common.save")}
          </Button>
        </>
      ) : null}

      {/* Scopes */}
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.scopes.title")}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t("userManagementPage.drawer.scopes.effective")}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {detail.effectiveScopes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ) : (
          detail.effectiveScopes.map((scope) => (
            <Chip key={scope} size="small" variant="outlined" label={scope} />
          ))
        )}
      </Box>
      {canWrite && scopes.length > 0 ? (
        <>
          <Typography variant="caption" color="text.secondary">
            {t("userManagementPage.drawer.scopes.overrides")}
          </Typography>
          <Box sx={{ display: "grid", gap: 0 }}>
            {scopes.map((scope) => (
              <FormControlLabel
                key={scope.code}
                control={
                  <Checkbox
                    size="small"
                    checked={scopesDraft.includes(scope.code)}
                    disabled={mutations.isBusy}
                    onChange={(event) => {
                      setScopesDraft(
                        event.target.checked
                          ? [...scopesDraft, scope.code]
                          : scopesDraft.filter((entry) => entry !== scope.code),
                      );
                    }}
                  />
                }
                label={`${scope.code} — ${scope.description}`}
              />
            ))}
          </Box>
          <Button
            size="small"
            variant="contained"
            sx={{ justifySelf: "start" }}
            disabled={mutations.isBusy}
            onClick={async () => {
              await onMutated(
                await mutations.updateScopes(detail.id, scopesDraft),
                t("userManagementPage.drawer.scopes.saved"),
              );
            }}
          >
            {t("common.save")}
          </Button>
        </>
      ) : null}

      {/* Audit trail */}
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {t("userManagementPage.drawer.audit.title")}
      </Typography>
      {audit.error ? (
        <Alert severity="error">
          {t("userManagementPage.drawer.audit.loadFailed")}
        </Alert>
      ) : null}
      {audit.isLoading ? <Skeleton height={60} /> : null}
      {!audit.isLoading && audit.data && audit.data.items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("userManagementPage.drawer.audit.empty")}
        </Typography>
      ) : null}
      {audit.data && audit.data.items.length > 0 ? (
        <List dense disablePadding>
          {audit.data.items.map((entry) => (
            <ListItem key={entry.id} disableGutters divider>
              <ListItemText
                primary={entry.action}
                secondary={`${formatDate(entry.createdAt, "—")}${
                  entry.actorEmail ? ` · ${entry.actorEmail}` : ""
                }`}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      {auditPageCount > 1 ? (
        <Pagination
          size="small"
          count={auditPageCount}
          page={auditPage}
          onChange={(_event, nextPage) => {
            setAuditPage(nextPage);
          }}
        />
      ) : null}
    </>
  );
}
