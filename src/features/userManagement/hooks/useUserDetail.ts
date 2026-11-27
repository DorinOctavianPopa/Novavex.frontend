import { useCallback, useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchUserDetail } from "@/features/userManagement/api/usersApi";
import type { ManagedUserDetail } from "@/features/userManagement/types";

interface UserDetailState {
  readonly detail: ManagedUserDetail | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useUserDetail(userId: string | null) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<UserDetailState>({
    detail: null,
    isLoading: false,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!accessToken || !userId) {
      setState({ detail: null, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ detail: null, isLoading: true, error: null });

    fetchUserDetail(accessToken, userId, controller.signal)
      .then((detail) => {
        setState({ detail, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          detail: null,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [accessToken, userId, refreshToken]);

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  return { ...state, refetch };
}
