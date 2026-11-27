import { useEffect, useState } from "react";

import { useAppContext } from "@/context";
import { fetchScopeCatalog } from "@/features/userManagement/api/usersApi";
import type { ScopeDefinition } from "@/features/userManagement/types";

interface ScopeCatalogState {
  readonly scopes: readonly ScopeDefinition[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useScopeCatalog(enabled: boolean) {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [state, setState] = useState<ScopeCatalogState>({
    scopes: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!accessToken || !enabled) {
      return;
    }

    const controller = new AbortController();
    setState({ scopes: [], isLoading: true, error: null });

    fetchScopeCatalog(accessToken, controller.signal)
      .then((scopes) => {
        setState({ scopes, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          scopes: [],
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, [accessToken, enabled]);

  return state;
}
