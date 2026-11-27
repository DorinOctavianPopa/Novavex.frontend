import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface ConfirmActionDialogProps {
  readonly open: boolean;
  readonly title: React.ReactNode;
  readonly message: React.ReactNode;
  readonly confirmLabel: React.ReactNode;
  readonly cancelLabel: React.ReactNode;
  /** Renders the confirm button in the error color for destructive actions. */
  readonly destructive?: boolean;
  readonly isBusy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** Blocking confirmation dialog used before destructive or high-impact admin actions. */
export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onClose={isBusy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isBusy} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isBusy}
          variant="contained"
          color={destructive ? "error" : "primary"}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
