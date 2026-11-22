import type { AuthSession, AuthRole } from "@/types/auth";

export interface FeatureModule {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly description: string;
  readonly status: "ready" | "planned";
  /** Short, uppercase code shown as a compact badge in grid/table views. */
  readonly alias?: string;
  /** Route to navigate to when the module can be run as a standalone page. */
  readonly route?: string;
}

export interface DirectoryNode {
  readonly name: string;
  readonly description: string;
}

export interface SupportLinks {
  readonly forgotPassword: string;
  readonly createAccount: string;
  readonly support: string;
  readonly privacy: string;
  readonly terms: string;
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
  readonly supportLinks: SupportLinks;
}

export type SignInErrorCode = "invalid-credentials";

export class SignInError extends Error {
  readonly code: SignInErrorCode;

  constructor(code: SignInErrorCode) {
    super(code);
    this.name = "SignInError";
    this.code = code;
  }
}

export interface SignInRequest {
  readonly email: string;
  readonly password: string;
}

export type MfaErrorCode = "invalid-code" | "expired-code";

export class MfaError extends Error {
  readonly code: MfaErrorCode;

  constructor(code: MfaErrorCode) {
    super(code);
    this.name = "MfaError";
    this.code = code;
  }
}

export interface MfaChallenge {
  readonly email: string;
  readonly expiresAt: string;
  readonly codeLength: number;
  /** Demo-only: no email provider is wired up, so the code is surfaced for preview access. */
  readonly previewCode: string;
}

export type SignUpErrorCode = "email-in-use";

export class SignUpError extends Error {
  readonly code: SignUpErrorCode;

  constructor(code: SignUpErrorCode) {
    super(code);
    this.name = "SignUpError";
    this.code = code;
  }
}

export interface SignUpRequest {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
}

export interface AppContextValue extends AppConfig {
  readonly session: AuthSession | null;
  readonly mfaChallenge: MfaChallenge | null;
  readonly signIn: (credentials: SignInRequest) => Promise<void>;
  readonly verifyMfaCode: (code: string) => Promise<void>;
  readonly resendMfaCode: () => Promise<void>;
  readonly cancelMfaChallenge: () => void;
  readonly signUpMfaChallenge: MfaChallenge | null;
  readonly signUp: (request: SignUpRequest) => Promise<void>;
  readonly verifySignUpMfaCode: (code: string) => Promise<void>;
  readonly resendSignUpMfaCode: () => Promise<void>;
  readonly cancelSignUpMfaChallenge: () => void;
  readonly signOut: () => void;
}
