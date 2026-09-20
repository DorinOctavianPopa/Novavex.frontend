import type { AuthSession, AuthRole } from '@/types/auth'

export interface FeatureModule {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly description: string
  readonly status: 'ready' | 'planned'
}

export interface DirectoryNode {
  readonly name: string
  readonly description: string
}

export interface SupportLinks {
  readonly forgotPassword: string
  readonly createAccount: string
  readonly support: string
  readonly privacy: string
  readonly terms: string
}

export interface SecurityConfig {
  readonly authentication: {
    readonly provider: 'oidc-oauth2'
    readonly accessTokenTtlMinutes: number
    readonly refreshTokenStorage: 'httpOnly-cookie'
  }
  readonly authorization: {
    readonly model: 'rbac+abac'
    readonly privilegedRoles: readonly AuthRole[]
  }
}

export interface AppConfig {
  readonly name: string
  readonly summary: string
  readonly security: SecurityConfig
  readonly supportLinks: SupportLinks
}

export type SignInErrorCode = 'invalid-credentials'

export class SignInError extends Error {
  readonly code: SignInErrorCode

  constructor(code: SignInErrorCode) {
    super(code)
    this.name = 'SignInError'
    this.code = code
  }
}

export interface SignInRequest {
  readonly email: string
  readonly password: string
}

export interface AppContextValue extends AppConfig {
  readonly session: AuthSession | null
  readonly signIn: (credentials: SignInRequest) => Promise<void>
  readonly signOut: () => void
}
