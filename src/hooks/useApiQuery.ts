import { useCallback, useEffect, useState } from "react";

export type ApiFetcher<T> = (signal: AbortSignal) => Promise<T>;

interface SettledQuery<T> {
  readonly fetcher: ApiFetcher<T>;
  readonly data: T | null;
  readonly error: string | null;
  readonly version: number;
}

/**
 * Minimal fetch-on-render query primitive shared by the admin feature hooks.
 *
 * Pass `null` to disable the query (e.g. while there is no access token or no
 * selected entity). The fetcher MUST be referentially stable (`useCallback`):
 * a new fetcher identity is what triggers a reload, and `isLoading` is derived
 * by comparing the fetcher that produced the settled result with the current
 * one — no state is written synchronously inside the effect.
 *
 * `version` increments every time a result settles, so uncontrolled consumers
 * (like the Grid) can be remounted via a React key when fresh rows arrive.
 */
export function useApiQuery<T>(fetcher: ApiFetcher<T> | null) {
  const [settled, setSettled] = useState<SettledQuery<T> | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!fetcher) {
      return;
    }

    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => {
        setSettled((current) => ({
          fetcher,
          data,
          error: null,
          version: (current?.version ?? 0) + 1,
        }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setSettled((current) => ({
          fetcher,
          data: null,
          error: error instanceof Error ? error.message : String(error),
          version: (current?.version ?? 0) + 1,
        }));
      });

    return () => {
      controller.abort();
    };
  }, [fetcher, refreshToken]);

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const isCurrent = settled !== null && settled.fetcher === fetcher;

  return {
    data: isCurrent ? settled.data : null,
    error: isCurrent ? settled.error : null,
    /** True while an enabled query has not yet settled for the current fetcher. */
    isLoading: fetcher !== null && !isCurrent,
    version: settled?.version ?? 0,
    refetch,
  };
}
