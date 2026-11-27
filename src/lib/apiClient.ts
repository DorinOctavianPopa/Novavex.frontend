// Shared JSON API client for authorized admin endpoints. Mirrors the fetch/logging
// conventions of src/features/authentication/api/loginApi.ts, plus Bearer-token
// support and RFC 7807 problem-details error extraction.

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type QueryParams = Readonly<
  Record<string, string | number | boolean | undefined>
>;

export interface ApiRequestOptions {
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
  readonly body?: unknown;
  readonly accessToken?: string;
  readonly query?: QueryParams;
  readonly signal?: AbortSignal;
}

function logApiDebug(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[api] ${message}`, details ?? "");
  }
}

function buildUrl(url: string, query?: QueryParams) {
  if (!query) {
    return url;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      title?: string;
      detail?: string;
      message?: string;
    };
    return (
      body.detail ??
      body.title ??
      body.message ??
      `Request failed with status ${response.status}`
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

/**
 * Performs a JSON request and parses the response. Returns `null` for 204
 * responses or empty bodies; throws `ApiError` for non-2xx statuses.
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T | null> {
  const { method = "GET", body, accessToken, query, signal } = options;
  const target = buildUrl(url, query);
  const startedAt = performance.now();
  logApiDebug(`${method} ${target} started`);

  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(target, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  logApiDebug(`${method} ${target} completed`, {
    status: response.status,
    ok: response.ok,
    durationMs: Math.round(performance.now() - startedAt),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
