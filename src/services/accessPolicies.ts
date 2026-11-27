import type { AccessPolicy } from '@/types'

// Shared route/nav access policies. Defined once so both the router (AppRoutes.tsx)
// and any navigation UI (e.g. the dashboard sidenav) agree on who can reach what.

// The dashboard is the universal landing page: it has no role/scope restriction so
// that every authenticated user, including a brand-new sign-up with no roles or
// scopes granted yet, can reach it right after logging in.
export const dashboardPolicy: AccessPolicy = {}

export const inventoryReadPolicy: AccessPolicy = {
  anyRoles: ['super_admin', 'cto', 'inventory_manager'],
  allScopes: ['inventory:read'],
}

export const accountingPolicy: AccessPolicy = {
  anyRoles: [
    'super_admin',
    'cto',
    'finance_manager',
    'senior_accountant',
    'junior_accountant',
  ],
}

// User management: cto can view the user base, but only super_admin can mutate it.
export const userManagementReadPolicy: AccessPolicy = {
  anyRoles: ['super_admin', 'cto'],
  allScopes: ['users:read'],
}

export const userManagementWritePolicy: AccessPolicy = {
  anyRoles: ['super_admin'],
  allScopes: ['users:write'],
}

export const userManagementAdminPolicy: AccessPolicy = {
  anyRoles: ['super_admin'],
  allScopes: ['users:admin'],
}

// Organization & department management mirrors the same read/write split.
export const organizationReadPolicy: AccessPolicy = {
  anyRoles: ['super_admin', 'cto'],
  allScopes: ['organizations:read'],
}

export const organizationWritePolicy: AccessPolicy = {
  anyRoles: ['super_admin'],
  allScopes: ['organizations:write'],
}
