import type { AuthRole } from "@/types";
import type {
  OrganizationMembership,
  PagedResult,
} from "@/features/organization";

export type { PagedResult };

/** All assignable roles, mirroring the AuthRole union in src/types/auth.ts. */
export const authRoles: readonly AuthRole[] = [
  "super_admin",
  "cto",
  "finance_manager",
  "senior_accountant",
  "junior_accountant",
  "inventory_manager",
  "sales_manager",
];

export type ManagedUserStatus = "active" | "inactive" | "locked" | "invited";

export interface ManagedUserSummary {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: readonly AuthRole[];
  readonly status: ManagedUserStatus;
  readonly primaryOrganizationName: string | null;
  readonly departmentNames: readonly string[];
  readonly lastSignInAt: string | null;
  readonly createdAt: string;
}

export interface ManagedUserDetail extends ManagedUserSummary {
  readonly emailVerifiedAt: string | null;
  readonly lockedUntil: string | null;
  readonly region: string;
  readonly clearanceLevel: number;
  readonly scopeOverrides: readonly string[];
  readonly effectiveScopes: readonly string[];
  readonly activeSessionCount: number;
  readonly memberships: readonly OrganizationMembership[];
}

export interface UserListParams {
  readonly search?: string;
  readonly role?: AuthRole;
  readonly status?: ManagedUserStatus;
  readonly organizationId?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/** One organization membership to write, with the departments held inside it. */
export interface MembershipInput {
  readonly organizationId: string;
  readonly isPrimary: boolean;
  readonly departmentIds: readonly string[];
}

export interface InviteUserRequest {
  readonly email: string;
  readonly fullName: string;
  readonly roles: readonly AuthRole[];
  readonly memberships: readonly MembershipInput[];
}

export interface UpdateAttributesRequest {
  readonly region: string;
  readonly clearanceLevel: number;
}

export interface ScopeDefinition {
  readonly code: string;
  readonly description: string;
}

export interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly actorEmail: string | null;
  readonly createdAt: string;
}
