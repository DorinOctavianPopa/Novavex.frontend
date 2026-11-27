import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

export interface DepartmentFormDialogProps {
  readonly open: boolean;
  readonly title: React.ReactNode;
  readonly initialName?: string;
  readonly isBusy?: boolean;
  readonly onSubmit: (name: string) => void;
  readonly onCancel: () => void;
}

/**
 * Name form shared by the "add department" and "rename department" flows.
 * Mount it only while open: the field seeds from `initialName` on mount.
 */
export function DepartmentFormDialog({
  open,
  title,
  initialName = "",
  isBusy = false,
  onSubmit,
  onCancel,
}: DepartmentFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  const trimmedName = name.trim();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (trimmedName) {
      onSubmit(trimmedName);
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
            label={t("organizationPage.dialogs.departmentName")}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
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
            disabled={isBusy || !trimmedName}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
