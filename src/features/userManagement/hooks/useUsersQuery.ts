import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchUsers } from "@/features/userManagement/api/usersApi";
import type { UserListParams } from "@/features/userManagement/types";
import { useApiQuery } from "@/hooks";

export function useUsersQuery(params: UserListParams) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const { search, role, status, organizationId, page, pageSize } = params;

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchUsers(
        accessToken,
        { search, role, status, organizationId, page, pageSize },
        signal,
      ),
    [accessToken, search, role, status, organizationId, page, pageSize],
  );

  return useApiQuery(accessToken ? fetcher : null);
}
