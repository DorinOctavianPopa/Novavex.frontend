import { useCallback, useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchUsers } from "@/features/userManagement/api/usersApi";
import type {
  ManagedUserSummary,
  PagedResult,
  UserListParams,
} from "@/features/userManagement/types";

interface UsersQueryState {
  readonly data: PagedResult<ManagedUserSummary> | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useUsersQuery(params: UserListParams) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<UsersQueryState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  const { search, role, status, organizationId, page, pageSize } = params;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchUsers(
      accessToken,
      { search, role, status, organizationId, page, pageSize },
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
  }, [accessToken, search, role, status, organizationId, page, pageSize, refreshToken]);

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  return { ...state, refetch };
}
