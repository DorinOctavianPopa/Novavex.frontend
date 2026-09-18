export type AuthRole =
  | 'super_admin'
  | 'cto'
  | 'finance_manager'
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
}
