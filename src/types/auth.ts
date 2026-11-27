export type AuthRole =
  | 'super_admin'
  | 'cto'
  | 'finance_manager'
  | 'senior_accountant'
  | 'junior_accountant'
  | 'inventory_manager'
  | 'sales_manager'

export interface UserAttributes {
  readonly tenantId: string
  readonly region: string
  readonly department: string
  readonly clearanceLevel: number
}

export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly roles: readonly AuthRole[]
  readonly attributes: UserAttributes
  /** Ids of every organization the user is an active member of. */
  readonly organizationIds: readonly string[]
  /** Id of the membership flagged as primary; drives the flat ABAC claims. */
  readonly primaryOrganizationId: string
  /** Ids of every department (across organizations) the user belongs to. */
  readonly departmentIds: readonly string[]
}

export interface AuthSession {
  readonly isAuthenticated: boolean
  readonly accessToken: string
  readonly accessTokenExpiresAt: string
  readonly refreshTokenStorage: 'httpOnly-cookie'
  readonly scopes: readonly string[]
  readonly user: AuthUser
}

export interface AttributeRule {
  readonly key: keyof UserAttributes
  readonly equals: string | number
}

export interface AccessPolicy {
  readonly anyRoles?: readonly AuthRole[]
  readonly allScopes?: readonly string[]
  readonly attributeRules?: readonly AttributeRule[]
  /** Passes when the user belongs to at least one of these organizations. Empty/undefined always passes. */
  readonly anyOrganizations?: readonly string[]
  /** Passes when the user belongs to at least one of these departments. Empty/undefined always passes. */
  readonly anyDepartments?: readonly string[]
}
