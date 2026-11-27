import { useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchUserAudit } from "@/features/userManagement/api/usersApi";
import type { AuditEntry, PagedResult } from "@/features/userManagement/types";

interface UserAuditState {
  readonly data: PagedResult<AuditEntry> | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useUserAudit(userId: string | null, page: number) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<UserAuditState>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!accessToken || !userId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchUserAudit(accessToken, userId, page, controller.signal)
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
  }, [accessToken, userId, page]);

  return state;
}
