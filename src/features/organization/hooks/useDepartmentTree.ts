import { useCallback, useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchDepartmentTree } from "@/features/organization/api/organizationsApi";
import type { DepartmentNode } from "@/features/organization/types";

interface DepartmentTreeState {
  readonly tree: readonly DepartmentNode[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useDepartmentTree(organizationId: string | null) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<DepartmentTreeState>({
    tree: [],
    isLoading: false,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!accessToken || !organizationId) {
      setState({ tree: [], isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ tree: [], isLoading: true, error: null });

    fetchDepartmentTree(accessToken, organizationId, controller.signal)
      .then((tree) => {
        setState({ tree, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          tree: [],
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [accessToken, organizationId, refreshToken]);

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  return { ...state, refetch };
}
