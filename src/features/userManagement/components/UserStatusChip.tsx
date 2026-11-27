import Chip from "@mui/material/Chip";
import { useTranslation } from "react-i18next";

import type { ManagedUserStatus } from "@/features/userManagement/types";

const statusColors: Record<
  ManagedUserStatus,
  "success" | "default" | "warning" | "info"
> = {
  active: "success",
  inactive: "default",
  locked: "warning",
  invited: "info",
};

export function UserStatusChip({
  status,
}: Readonly<{ status: ManagedUserStatus }>) {
  const { t } = useTranslation();

  return (
    <Chip
      size="small"
      variant="outlined"
      color={statusColors[status]}
      label={t(`userManagementPage.status.${status}`)}
    />
  );
}
