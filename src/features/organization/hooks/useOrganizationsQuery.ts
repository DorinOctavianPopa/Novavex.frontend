import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchOrganizations } from "@/features/organization/api/organizationsApi";
import type { OrganizationListParams } from "@/features/organization/types";
import { useApiQuery } from "@/hooks";

export function useOrganizationsQuery(params: OrganizationListParams) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const { search, status, page, pageSize } = params;

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchOrganizations(accessToken, { search, status, page, pageSize }, signal),
    [accessToken, search, status, page, pageSize],
  );

  return useApiQuery(accessToken ? fetcher : null);
}
