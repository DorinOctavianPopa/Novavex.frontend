import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchScopeCatalog } from "@/features/userManagement/api/usersApi";
import { useApiQuery } from "@/hooks";

export function useScopeCatalog(enabled: boolean) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";

  const fetcher = useCallback(
    (signal: AbortSignal) => fetchScopeCatalog(accessToken, signal),
    [accessToken],
  );

  const query = useApiQuery(accessToken && enabled ? fetcher : null);

  return {
    scopes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
