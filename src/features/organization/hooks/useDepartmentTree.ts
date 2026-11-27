import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchDepartmentTree } from "@/features/organization/api/organizationsApi";
import { useApiQuery } from "@/hooks";

export function useDepartmentTree(organizationId: string | null) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchDepartmentTree(accessToken, organizationId ?? "", signal),
    [accessToken, organizationId],
  );

  const query = useApiQuery(accessToken && organizationId ? fetcher : null);

  return {
    tree: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
