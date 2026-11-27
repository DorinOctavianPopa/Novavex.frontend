import { useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

import type { DepartmentNode } from "@/features/organization/types";
import {
  collectSubtreeIds,
  flattenDepartmentTree,
  maxDepartmentDepth,
  subtreeHeight,
} from "@/features/organization/utils/departmentTree";

const topLevelValue = "__top__";

export interface MoveDepartmentDialogProps {
  readonly open: boolean;
  /** The department being moved; `null` while the dialog is closed. */
  readonly department: DepartmentNode | null;
  readonly tree: readonly DepartmentNode[];
  readonly isBusy?: boolean;
  /** Called with the chosen parent id, or `null` to move to the top level. */
  readonly onMove: (parentId: string | null) => void;
  readonly onCancel: () => void;
}

/**
 * Reparenting dialog: offers only valid destinations (same org, no cycles,
 * depth cap). Mount it only while open: the selection seeds from the
 * department's current parent on mount.
 */
export function MoveDepartmentDialog({
  open,
  department,
  tree,
  isBusy = false,
  onMove,
  onCancel,
}: MoveDepartmentDialogProps) {
  const { t } = useTranslation();

  const flattened = useMemo(() => flattenDepartmentTree(tree), [tree]);

  const currentParentId = useMemo(
    () =>
      department
        ? (flattened.find((entry) => entry.node.id === department.id)?.parentId ??
          null)
        : null,
    [flattened, department],
  );

  const [destination, setDestination] = useState(
    () => currentParentId ?? topLevelValue,
  );

  const options = useMemo(() => {
    if (!department) {
      return [];
    }

    // A node cannot be moved under itself or any of its descendants, and the
    // moved subtree must still fit within the maximum tree depth.
    const invalidIds = new Set(collectSubtreeIds(department));
    const movedHeight = subtreeHeight(department);

    return flattened.filter(
      (entry) =>
        !invalidIds.has(entry.node.id) &&
        entry.node.depth + movedHeight <= maxDepartmentDepth,
    );
  }, [flattened, department]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onMove(destination === topLevelValue ? null : destination);
  }

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {t("organizationPage.dialogs.moveTitle", {
            name: department?.name ?? "",
          })}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="dense"
            label={t("organizationPage.dialogs.moveDestination")}
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
            }}
            disabled={isBusy}
          >
            <MenuItem value={topLevelValue}>
              {t("organizationPage.dialogs.moveTopLevel")}
            </MenuItem>
            {options.map((entry) => (
              <MenuItem
                key={entry.node.id}
                value={entry.node.id}
                sx={{ pl: 2 + (entry.node.depth - 1) * 2 }}
              >
                {entry.node.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={isBusy} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={isBusy}>
            {t("organizationPage.dialogs.moveAction")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
