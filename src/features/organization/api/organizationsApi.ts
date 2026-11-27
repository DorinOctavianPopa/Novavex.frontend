import { apiRequest } from "@/lib";

import type {
  CreateDepartmentRequest,
  DepartmentNode,
  OrganizationListParams,
  OrganizationMemberSummary,
  OrganizationMembersParams,
  OrganizationSummary,
  PagedResult,
  SaveOrganizationRequest,
  TenantSummary,
  UpdateDepartmentRequest,
} from "@/features/organization/types";

// Same env-override pattern as VITE_LOGIN_API_BASE_URL in loginApi.ts; the dev
// server proxies /api/* to the backend (see vite.config.ts).
const organizationsEndpoint =
  import.meta.env.VITE_ORGS_API_BASE_URL ?? "/api/admin/organizations";

export async function fetchTenants(accessToken: string, signal?: AbortSignal): Promise<readonly TenantSummary[]> {
  const result = await apiRequest<readonly TenantSummary[]>(`${organizationsEndpoint}/tenants`, { accessToken, signal });
  if (result === null) throw new Error("Tenant list response was empty.");
  return result;
}

export async function fetchOrganizations(
  accessToken: string,
  params: OrganizationListParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<OrganizationSummary>> {
  const result = await apiRequest<PagedResult<OrganizationSummary>>(
    organizationsEndpoint,
    { accessToken, query: { ...params }, signal },
  );

  return (
    result ?? { items: [], page: 1, pageSize: params.pageSize ?? 20, totalCount: 0 }
  );
}

export async function createOrganization(
  accessToken: string,
  request: SaveOrganizationRequest,
): Promise<OrganizationSummary | null> {
  return apiRequest<OrganizationSummary>(organizationsEndpoint, {
    method: "POST",
    body: request,
    accessToken,
  });
}

export async function updateOrganization(
  accessToken: string,
  organizationId: string,
  request: SaveOrganizationRequest,
): Promise<OrganizationSummary | null> {
  return apiRequest<OrganizationSummary>(
    `${organizationsEndpoint}/${organizationId}`,
    { method: "PUT", body: request, accessToken },
  );
}

export async function setOrganizationActive(
  accessToken: string,
  organizationId: string,
  isActive: boolean,
): Promise<void> {
  await apiRequest<void>(
    `${organizationsEndpoint}/${organizationId}/${isActive ? "activate" : "deactivate"}`,
    { method: "POST", accessToken },
  );
}

export async function fetchDepartmentTree(
  accessToken: string,
  organizationId: string,
  signal?: AbortSignal,
): Promise<readonly DepartmentNode[]> {
  const result = await apiRequest<readonly DepartmentNode[]>(
    `${organizationsEndpoint}/${organizationId}/departments`,
    { accessToken, signal },
  );

  return result ?? [];
}

export async function createDepartment(
  accessToken: string,
  organizationId: string,
  request: CreateDepartmentRequest,
): Promise<DepartmentNode | null> {
  return apiRequest<DepartmentNode>(
    `${organizationsEndpoint}/${organizationId}/departments`,
    { method: "POST", body: request, accessToken },
  );
}

export async function updateDepartment(
  accessToken: string,
  organizationId: string,
  departmentId: string,
  request: UpdateDepartmentRequest,
): Promise<DepartmentNode | null> {
  return apiRequest<DepartmentNode>(
    `${organizationsEndpoint}/${organizationId}/departments/${departmentId}`,
    { method: "PUT", body: request, accessToken },
  );
}

export async function deactivateDepartment(
  accessToken: string,
  organizationId: string,
  departmentId: string,
): Promise<void> {
  await apiRequest<void>(
    `${organizationsEndpoint}/${organizationId}/departments/${departmentId}/deactivate`,
    { method: "POST", accessToken },
  );
}

export async function fetchOrganizationMembers(
  accessToken: string,
  organizationId: string,
  params: OrganizationMembersParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<OrganizationMemberSummary>> {
  const result = await apiRequest<PagedResult<OrganizationMemberSummary>>(
    `${organizationsEndpoint}/${organizationId}/members`,
    { accessToken, query: { ...params }, signal },
  );

  return (
    result ?? { items: [], page: 1, pageSize: params.pageSize ?? 10, totalCount: 0 }
  );
}
