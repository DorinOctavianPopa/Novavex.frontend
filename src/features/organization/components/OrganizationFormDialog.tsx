import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/context";
import { fetchTenants } from "@/features/organization/api/organizationsApi";
import type { SaveOrganizationRequest, TenantSummary } from "@/features/organization/types";

export interface OrganizationFormDialogProps {
  readonly open: boolean;
  readonly title: React.ReactNode;
  readonly initialValues?: SaveOrganizationRequest;
  readonly isBusy?: boolean;
  readonly onSubmit: (request: SaveOrganizationRequest) => void;
  readonly onCancel: () => void;
}

/**
 * Create/edit form for an organization's name and region.
 * Mount it only while open: the fields seed from `initialValues` on mount.
 */
export function OrganizationFormDialog({
  open,
  title,
  initialValues,
  isBusy = false,
  onSubmit,
  onCancel,
}: OrganizationFormDialogProps) {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [region, setRegion] = useState(initialValues?.region ?? "");
  const [tenantId, setTenantId] = useState(initialValues?.tenantId ?? "");
  const [tenants, setTenants] = useState<readonly TenantSummary[]>([]);
  const [tenantError, setTenantError] = useState(false);
  useEffect(() => {
    if (initialValues) return;
    const controller = new AbortController();
    void fetchTenants(session?.accessToken ?? "", controller.signal)
      .then(setTenants)
      .catch(() => { if (!controller.signal.aborted) setTenantError(true); });
    return () => controller.abort();
  }, [initialValues, session?.accessToken]);

  const trimmedName = name.trim();
  const trimmedRegion = region.trim();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (tenantId && trimmedName && trimmedRegion) {
      onSubmit({ tenantId, name: trimmedName, region: trimmedRegion });
    }
  }

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {!initialValues && tenantError ? <Alert severity="error">{t("organizationPage.errors.tenantLoadFailed")}</Alert> : null}
          {!initialValues ? (
            <TextField select fullWidth required margin="dense" label={t("organizationPage.dialogs.tenant")}
              value={tenantId} onChange={(event) => setTenantId(event.target.value)} disabled={isBusy || tenantError}>
              {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.region})</MenuItem>)}
            </TextField>
          ) : null}
          <TextField
            autoFocus
            fullWidth
            required
            margin="dense"
            label={t("organizationPage.dialogs.organizationName")}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            disabled={isBusy}
          />
          <TextField
            fullWidth
            required
            margin="dense"
            label={t("organizationPage.dialogs.organizationRegion")}
            value={region}
            onChange={(event) => {
              setRegion(event.target.value);
            }}
            disabled={isBusy}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={isBusy} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isBusy || !tenantId || !trimmedName || !trimmedRegion}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
