import type { FeatureModule } from "@/types";

export { OrganizationManagementPage } from "@/features/organization/pages/OrganizationManagementPage";
export { DepartmentTreePicker } from "@/features/organization/components/DepartmentTreePicker";
export { useDepartmentTree } from "@/features/organization/hooks/useDepartmentTree";
export type {
  DepartmentNode,
  DepartmentRef,
  OrganizationMembership,
  OrganizationSummary,
  PagedResult,
} from "@/features/organization/types";

export const organizationModule: FeatureModule = {
  id: "organization",
  name: "Organizations",
  path: "src/features/organization",
  description:
    "Organization and multilevel department administration with membership rosters.",
  status: "ready",
  alias: "ORG",
  route: "/organizations",
};
