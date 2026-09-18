import type { AuthSession, AuthRole } from "@/types/auth";

export interface FeatureModule {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly description: string;
  readonly status: "ready" | "planned";
}

export interface DirectoryNode {
  readonly name: string;
  readonly description: string;
}

export interface SecurityConfig {
  readonly authentication: {
    readonly provider: "oidc-oauth2";
    readonly accessTokenTtlMinutes: number;
    readonly refreshTokenStorage: "httpOnly-cookie";
  };
  readonly authorization: {
    readonly model: "rbac+abac";
    readonly privilegedRoles: readonly AuthRole[];
  };
}

export interface AppConfig {
  readonly name: string;
  readonly summary: string;
  readonly security: SecurityConfig;
}

export interface AppContextValue extends AppConfig {
  readonly session: AuthSession;
  readonly signIn: (email: string, password: string) => void;
  readonly signOut: () => void;
}
