import type { FeatureModule } from "@/types";

export { UserManagementPage } from "@/features/userManagement/pages/UserManagementPage";
export type {
  AuditEntry,
  InviteUserRequest,
  ManagedUserDetail,
  ManagedUserStatus,
  ManagedUserSummary,
  MembershipInput,
  ScopeDefinition,
} from "@/features/userManagement/types";
export { authRoles } from "@/features/userManagement/types";

export const userManagementModule: FeatureModule = {
  id: "user-management",
  name: "User management",
  path: "src/features/userManagement",
  description:
    "Admin user administration: invitations, roles, scopes, memberships and account actions.",
  status: "ready",
  alias: "USR",
  route: "/users",
};
