import { apiRequest } from "@/lib";
import type { AuthRole } from "@/types";

import type {
  AuditEntry,
  InviteUserRequest,
  ManagedUserDetail,
  ManagedUserSummary,
  MembershipInput,
  PagedResult,
  ScopeDefinition,
  UpdateAttributesRequest,
  UserListParams,
} from "@/features/userManagement/types";

// Same env-override pattern as VITE_LOGIN_API_BASE_URL in loginApi.ts; the dev
// server proxies /api/* to the backend (see vite.config.ts).
const usersEndpoint =
  import.meta.env.VITE_USERS_API_BASE_URL ?? "/api/admin/users";
const scopesEndpoint =
  import.meta.env.VITE_SCOPES_API_BASE_URL ?? "/api/admin/scopes";

export async function fetchUsers(
  accessToken: string,
  params: UserListParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<ManagedUserSummary>> {
  const result = await apiRequest<PagedResult<ManagedUserSummary>>(
    usersEndpoint,
    { accessToken, query: { ...params }, signal },
  );

  return (
    result ?? { items: [], page: 1, pageSize: params.pageSize ?? 20, totalCount: 0 }
  );
}

export async function fetchUserDetail(
  accessToken: string,
  userId: string,
  signal?: AbortSignal,
): Promise<ManagedUserDetail | null> {
  return apiRequest<ManagedUserDetail>(`${usersEndpoint}/${userId}`, {
    accessToken,
    signal,
  });
}

export async function fetchUserAudit(
  accessToken: string,
  userId: string,
  page: number,
  signal?: AbortSignal,
): Promise<PagedResult<AuditEntry>> {
  const result = await apiRequest<PagedResult<AuditEntry>>(
    `${usersEndpoint}/${userId}/audit`,
    { accessToken, query: { page }, signal },
  );

  return result ?? { items: [], page: 1, pageSize: 10, totalCount: 0 };
}

export async function fetchScopeCatalog(
  accessToken: string,
  signal?: AbortSignal,
): Promise<readonly ScopeDefinition[]> {
  const result = await apiRequest<readonly ScopeDefinition[]>(scopesEndpoint, {
    accessToken,
    signal,
  });

  return result ?? [];
}

export async function createInvitation(
  accessToken: string,
  request: InviteUserRequest,
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/invitations`, {
    method: "POST",
    body: request,
    accessToken,
  });
}

export async function updateUserRoles(
  accessToken: string,
  userId: string,
  roles: readonly AuthRole[],
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/roles`, {
    method: "PUT",
    body: { roles },
    accessToken,
  });
}

export async function updateUserAttributes(
  accessToken: string,
  userId: string,
  request: UpdateAttributesRequest,
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/attributes`, {
    method: "PUT",
    body: request,
    accessToken,
  });
}

export async function updateUserScopes(
  accessToken: string,
  userId: string,
  scopeCodes: readonly string[],
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/scopes`, {
    method: "PUT",
    body: { scopeCodes },
    accessToken,
  });
}

export async function updateUserMemberships(
  accessToken: string,
  userId: string,
  memberships: readonly MembershipInput[],
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/memberships`, {
    method: "PUT",
    body: { memberships },
    accessToken,
  });
}

export async function sendPasswordReset(
  accessToken: string,
  userId: string,
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/password-reset`, {
    method: "POST",
    accessToken,
  });
}

export async function setUserActive(
  accessToken: string,
  userId: string,
  isActive: boolean,
): Promise<void> {
  await apiRequest<void>(
    `${usersEndpoint}/${userId}/${isActive ? "activate" : "deactivate"}`,
    { method: "POST", accessToken },
  );
}

export async function unlockUser(
  accessToken: string,
  userId: string,
): Promise<void> {
  await apiRequest<void>(`${usersEndpoint}/${userId}/unlock`, {
    method: "POST",
    accessToken,
  });
}

export async function revokeUserSessions(
  accessToken: string,
  userId: string,
): Promise<number> {
  const result = await apiRequest<{ revokedCount: number }>(
    `${usersEndpoint}/${userId}/sessions/revoke`,
    { method: "POST", accessToken },
  );

  return result?.revokedCount ?? 0;
}
