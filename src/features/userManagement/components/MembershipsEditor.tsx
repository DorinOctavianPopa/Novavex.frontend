import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import {
  DepartmentTreePicker,
  useDepartmentTree,
} from "@/features/organization";
import type { OrganizationSummary } from "@/features/organization";
import type { MembershipInput } from "@/features/userManagement/types";

export interface MembershipsEditorProps {
  readonly value: readonly MembershipInput[];
  readonly onChange: (memberships: readonly MembershipInput[]) => void;
  /** Organizations available for assignment. */
  readonly organizations: readonly OrganizationSummary[];
  readonly disabled?: boolean;
}

/**
 * Edits a user's organization memberships: one or more organizations (exactly
 * one primary) with a multi-select over each organization's department tree.
 */
export function MembershipsEditor({
  value,
  onChange,
  organizations,
  disabled = false,
}: MembershipsEditorProps) {
  const { t } = useTranslation();
  const [pendingOrgId, setPendingOrgId] = useState("");

  const assignedIds = new Set(value.map((membership) => membership.organizationId));
  const availableOrganizations = organizations.filter(
    (organization) => organization.isActive && !assignedIds.has(organization.id),
  );

  function addMembership() {
    if (!pendingOrgId) {
      return;
    }

    onChange([
      ...value,
      {
        organizationId: pendingOrgId,
        // The first membership automatically becomes the primary one.
        isPrimary: value.length === 0,
        departmentIds: [],
      },
    ]);
    setPendingOrgId("");
  }

  function removeMembership(organizationId: string) {
    const remaining = value.filter(
      (membership) => membership.organizationId !== organizationId,
    );

    // If the primary membership was removed, promote the first remaining one.
    if (
      remaining.length > 0 &&
      !remaining.some((membership) => membership.isPrimary)
    ) {
      onChange([
        { ...remaining[0], isPrimary: true },
        ...remaining.slice(1),
      ]);
      return;
    }

    onChange(remaining);
  }

  function setPrimary(organizationId: string) {
    onChange(
      value.map((membership) => ({
        ...membership,
        isPrimary: membership.organizationId === organizationId,
      })),
    );
  }

  function setDepartments(
    organizationId: string,
    departmentIds: readonly string[],
  ) {
    onChange(
      value.map((membership) =>
        membership.organizationId === organizationId
          ? { ...membership, departmentIds }
          : membership,
      ),
    );
  }

  function organizationName(organizationId: string) {
    return (
      organizations.find((organization) => organization.id === organizationId)
        ?.name ?? organizationId
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {value.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("userManagementPage.drawer.memberships.none")}
        </Typography>
      ) : null}

      {value.map((membership) => (
        <MembershipRow
          key={membership.organizationId}
          membership={membership}
          organizationName={organizationName(membership.organizationId)}
          disabled={disabled}
          onSetPrimary={() => {
            setPrimary(membership.organizationId);
          }}
          onRemove={() => {
            removeMembership(membership.organizationId);
          }}
          onDepartmentsChange={(departmentIds) => {
            setDepartments(membership.organizationId, departmentIds);
          }}
        />
      ))}

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          select
          size="small"
          sx={{ minWidth: 220 }}
          label={t("userManagementPage.drawer.memberships.addOrganization")}
          value={pendingOrgId}
          onChange={(event) => {
            setPendingOrgId(event.target.value);
          }}
          disabled={disabled || availableOrganizations.length === 0}
        >
          {availableOrganizations.map((organization) => (
            <MenuItem key={organization.id} value={organization.id}>
              {organization.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addMembership}
          disabled={disabled || !pendingOrgId}
        >
          {t("common.add")}
        </Button>
      </Box>
    </Box>
  );
}

function MembershipRow({
  membership,
  organizationName,
  disabled,
  onSetPrimary,
  onRemove,
  onDepartmentsChange,
}: Readonly<{
  membership: MembershipInput;
  organizationName: string;
  disabled: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  onDepartmentsChange: (departmentIds: readonly string[]) => void;
}>) {
  const { t } = useTranslation();
  const { tree, isLoading } = useDepartmentTree(membership.organizationId);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        display: "grid",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {organizationName}
        </Typography>
        <Tooltip title={t("userManagementPage.drawer.memberships.primary")}>
          <Radio
            size="small"
            checked={membership.isPrimary}
            onChange={onSetPrimary}
            disabled={disabled}
            inputProps={{
              "aria-label": t("userManagementPage.drawer.memberships.primary"),
            }}
          />
        </Tooltip>
        {membership.isPrimary ? (
          <Typography variant="caption" color="primary">
            {t("userManagementPage.drawer.memberships.primary")}
          </Typography>
        ) : null}
        <Tooltip title={t("userManagementPage.drawer.memberships.remove")}>
          <span style={{ marginLeft: "auto" }}>
            <IconButton
              size="small"
              color="error"
              onClick={onRemove}
              disabled={disabled}
              aria-label={t("userManagementPage.drawer.memberships.remove")}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {isLoading ? (
        <Skeleton height={32} />
      ) : (
        <DepartmentTreePicker
          tree={tree}
          selectedIds={membership.departmentIds}
          onChange={onDepartmentsChange}
          disabled={disabled}
        />
      )}
    </Box>
  );
}
