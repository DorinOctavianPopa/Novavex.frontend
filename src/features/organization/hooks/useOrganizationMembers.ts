import { useCallback, useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchOrganizationMembers } from "@/features/organization/api/organizationsApi";
import type {
  OrganizationMemberSummary,
  OrganizationMembersParams,
  PagedResult,
} from "@/features/organization/types";

interface OrganizationMembersState {
  readonly data: PagedResult<OrganizationMemberSummary> | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useOrganizationMembers(
  organizationId: string | null,
  params: OrganizationMembersParams,
) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<OrganizationMembersState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const { departmentId, includeDescendants, page, pageSize } = params;

  useEffect(() => {
    if (!accessToken || !organizationId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchOrganizationMembers(
      accessToken,
      organizationId,
      { departmentId, includeDescendants, page, pageSize },
      controller.signal,
    )
      .then((data) => {
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [accessToken, organizationId, departmentId, includeDescendants, page, pageSize]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, reset };
}
