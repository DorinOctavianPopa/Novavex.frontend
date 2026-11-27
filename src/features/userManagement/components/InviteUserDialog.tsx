import { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import type { OrganizationSummary } from "@/features/organization";
import { MembershipsEditor } from "@/features/userManagement/components/MembershipsEditor";
import { authRoles } from "@/features/userManagement/types";
import type {
  InviteUserRequest,
  MembershipInput,
} from "@/features/userManagement/types";
import type { AuthRole } from "@/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteUserDialogProps {
  readonly open: boolean;
  readonly organizations: readonly OrganizationSummary[];
  readonly isBusy?: boolean;
  readonly onSubmit: (request: InviteUserRequest) => void;
  readonly onCancel: () => void;
}

/**
 * Admin pre-provisioning: email + name + roles + organization/department
 * memberships. Mount it only while open: the form starts empty on mount.
 */
export function InviteUserDialog({
  open,
  organizations,
  isBusy = false,
  onSubmit,
  onCancel,
}: InviteUserDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<readonly AuthRole[]>([]);
  const [memberships, setMemberships] = useState<readonly MembershipInput[]>([]);

  const trimmedEmail = email.trim();
  const trimmedName = fullName.trim();
  const isValid =
    emailPattern.test(trimmedEmail) && trimmedName.length > 0 && memberships.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isValid) {
      onSubmit({ email: trimmedEmail, fullName: trimmedName, roles, memberships });
    }
  }

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onCancel} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("userManagementPage.invite.title")}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5 }}>
          <TextField
            autoFocus
            fullWidth
            required
            type="email"
            margin="dense"
            label={t("userManagementPage.invite.email")}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            disabled={isBusy}
          />
          <TextField
            fullWidth
            required
            label={t("userManagementPage.invite.fullName")}
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
            disabled={isBusy}
          />
          <TextField
            select
            fullWidth
            label={t("userManagementPage.invite.roles")}
            value={roles}
            onChange={(event) => {
              // MUI's multiple Select yields string[] through the change event value.
              setRoles(event.target.value as unknown as AuthRole[]);
            }}
            disabled={isBusy}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (selected) => (
                  <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(selected as readonly AuthRole[]).map((role) => (
                      <Chip key={role} size="small" label={t(`roles.${role}`)} />
                    ))}
                  </span>
                ),
              },
            }}
          >
            {authRoles.map((role) => (
              <MenuItem key={role} value={role}>
                <Checkbox size="small" checked={roles.includes(role)} />
                <ListItemText primary={t(`roles.${role}`)} />
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            {t("userManagementPage.invite.memberships")}
          </Typography>
          <MembershipsEditor
            value={memberships}
            onChange={setMemberships}
            organizations={organizations}
            disabled={isBusy}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={isBusy} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={isBusy || !isValid}>
            {t("userManagementPage.invite.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
