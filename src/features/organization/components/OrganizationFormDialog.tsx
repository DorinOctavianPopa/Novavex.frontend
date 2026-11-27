import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

import type { SaveOrganizationRequest } from "@/features/organization/types";

export interface OrganizationFormDialogProps {
  readonly open: boolean;
  readonly title: React.ReactNode;
  readonly initialValues?: SaveOrganizationRequest;
  readonly isBusy?: boolean;
  readonly onSubmit: (request: SaveOrganizationRequest) => void;
  readonly onCancel: () => void;
}

/** Create/edit form for an organization's name and region. */
export function OrganizationFormDialog({
  open,
  title,
  initialValues,
  isBusy = false,
  onSubmit,
  onCancel,
}: OrganizationFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [region, setRegion] = useState(initialValues?.region ?? "");

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? "");
      setRegion(initialValues?.region ?? "");
    }
  }, [open, initialValues]);

  const trimmedName = name.trim();
  const trimmedRegion = region.trim();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (trimmedName && trimmedRegion) {
      onSubmit({ name: trimmedName, region: trimmedRegion });
    }
  }

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
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
            disabled={isBusy || !trimmedName || !trimmedRegion}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
