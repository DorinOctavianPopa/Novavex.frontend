import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchUserDetail } from "@/features/userManagement/api/usersApi";
import { useApiQuery } from "@/hooks";

export function useUserDetail(userId: string | null) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchUserDetail(accessToken, userId ?? "", signal),
    [accessToken, userId],
  );

  const query = useApiQuery(accessToken && userId ? fetcher : null);

  return {
    detail: query.data,
    isLoading: query.isLoading,
    error: query.error,
    version: query.version,
    refetch: query.refetch,
  };
}
