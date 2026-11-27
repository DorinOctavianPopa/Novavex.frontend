import { useCallback } from "react";

import { useAppContext } from "@/context";
import { fetchOrganizationMembers } from "@/features/organization/api/organizationsApi";
import type { OrganizationMembersParams } from "@/features/organization/types";
import { useApiQuery } from "@/hooks";

export function useOrganizationMembers(
  organizationId: string | null,
  params: OrganizationMembersParams,
) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const { departmentId, includeDescendants, page, pageSize } = params;

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      fetchOrganizationMembers(
        accessToken,
        organizationId ?? "",
        { departmentId, includeDescendants, page, pageSize },
        signal,
      ),
    [accessToken, organizationId, departmentId, includeDescendants, page, pageSize],
  );

  return useApiQuery(accessToken && organizationId ? fetcher : null);
}
