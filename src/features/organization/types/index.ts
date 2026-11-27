export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface TenantSummary {
  readonly id: string;
  readonly name: string;
  readonly region: string;
}

export interface OrganizationSummary {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly region: string;
  readonly isActive: boolean;
  readonly departmentCount: number;
  readonly memberCount: number;
}

/** A node of an organization's department tree (multilevel, max depth 6). */
export interface DepartmentNode {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
  readonly isActive: boolean;
  readonly memberCount: number;
  readonly children: readonly DepartmentNode[];
}

/** One organization membership of a user, with the departments held inside it. */
export interface OrganizationMembership {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly isPrimary: boolean;
  readonly departments: readonly DepartmentRef[];
}

export interface DepartmentRef {
  readonly id: string;
  readonly name: string;
}

export interface OrganizationMemberSummary {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly departmentNames: readonly string[];
}

export interface OrganizationListParams {
  readonly search?: string;
  readonly status?: "active" | "inactive";
  readonly page?: number;
  readonly pageSize?: number;
}

export interface OrganizationMembersParams {
  readonly departmentId?: string;
  readonly includeDescendants?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface SaveOrganizationRequest {
  readonly tenantId: string;
  readonly name: string;
  readonly region: string;
}

export interface CreateDepartmentRequest {
  readonly name: string;
  readonly parentId?: string;
}

export interface UpdateDepartmentRequest {
  readonly name?: string;
  readonly parentId?: string | null;
}
