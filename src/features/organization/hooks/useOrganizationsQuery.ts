import { useCallback, useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchOrganizations } from "@/features/organization/api/organizationsApi";
import type {
  OrganizationListParams,
  OrganizationSummary,
  PagedResult,
} from "@/features/organization/types";

interface OrganizationsQueryState {
  readonly data: PagedResult<OrganizationSummary> | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useOrganizationsQuery(params: OrganizationListParams) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<OrganizationsQueryState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  const { search, status, page, pageSize } = params;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchOrganizations(
      accessToken,
      { search, status, page, pageSize },
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
  }, [accessToken, search, status, page, pageSize, refreshToken]);

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  return { ...state, refetch };
}
