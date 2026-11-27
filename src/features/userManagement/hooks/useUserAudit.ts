import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchUserAudit } from "@/features/userManagement/api/usersApi";
import { useApiQuery } from "@/hooks";

export function useUserAudit(userId: string | null, page: number) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchUserAudit(accessToken, userId ?? "", page, signal),
    [accessToken, userId, page],
  );

  return useApiQuery(accessToken && userId ? fetcher : null);
}
