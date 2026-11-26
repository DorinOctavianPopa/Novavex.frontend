import type { AuthRole, AuthSession } from "@/types";

interface ChallengeResponseBody {
  readonly challengeId: string;
  readonly expiresAt: string;
}

interface TokenResponseBody {
  readonly accessToken: string;
  readonly expiresAt: string;
}

export interface SignInChallenge {
  readonly challengeId: string;
  readonly expiresAt: string;
}

export interface SignUpChallenge {
  readonly challengeId: string;
  readonly expiresAt: string;
}

export interface AccessToken {
  readonly accessToken: string;
  readonly expiresAt: string;
}

// LoginController.cs is mounted with a doubled "/api/api" prefix: Program.cs applies
// `UsePathBase("/api")` on top of the controller's own `[Route("api/[controller]")]`
// template, so the real endpoints are POST /api/api/login(/verify) and
// /api/api/login/users(/verify). See NovavexWA.Tests/LoginServiceTests.cs for confirmation.
const loginEndpoint = import.meta.env.VITE_LOGIN_API_BASE_URL ?? "/api/login";

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${loginEndpoint}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function assertExpectedStatus(response: Response) {
  if (!response.ok && response.status !== 401) {
    throw new Error(`Login request failed with status ${response.status}`);
  }
}

/** Validates credentials and requests a new emailed sign-in code. Null means invalid credentials. */
export async function requestSignInChallenge(
  email: string,
  password: string,
): Promise<SignInChallenge | null> {
  const response = await postJson("", { email, password });

  if (response.status === 401) {
    return null;
  }

  assertExpectedStatus(response);
  return parseJson<ChallengeResponseBody>(response);
}

/** Verifies the emailed sign-in code. Null means the challenge or code was rejected. */
export async function verifySignInCode(
  challengeId: string,
  code: string,
): Promise<AccessToken | null> {
  const response = await postJson("/verify", { challengeId, code });

  if (response.status === 401) {
    return null;
  }

  assertExpectedStatus(response);
  return parseJson<TokenResponseBody>(response);
}

/** Starts sign-up for an email; always returns a challenge (to avoid leaking account existence). */
export async function requestSignUpChallenge(
  email: string,
): Promise<SignUpChallenge> {
  const response = await postJson("/users", { email });
  assertExpectedStatus(response);
  const body = await parseJson<ChallengeResponseBody>(response);

  if (!body) {
    throw new Error("Sign-up challenge response was empty.");
  }

  return body;
}

/** Verifies the emailed sign-up code and creates the account. False means the code was rejected. */
export async function completeSignUp(request: {
  readonly challengeId: string;
  readonly code: string;
  readonly fullName: string;
  readonly password: string;
}): Promise<boolean> {
  const response = await postJson("/users/verify", request);

  if (response.status === 401) {
    return false;
  }

  assertExpectedStatus(response);
  return true;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeAccessTokenClaims(accessToken: string): Record<string, unknown> {
  const payload = accessToken.split(".")[1];

  if (!payload) {
    return {};
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? [value] : [];
}

function toStringClaim(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// The access token's JWT claims (sub/email/role/scope/attributes) are decoded client-side only to
// populate the UI session; the backend independently validates the token's signature on every call.
export function buildSessionFromAccessToken(
  accessToken: string,
  expiresAt: string,
): AuthSession {
  const claims = decodeAccessTokenClaims(accessToken);

  return {
    isAuthenticated: true,
    accessToken,
    accessTokenExpiresAt: expiresAt,
    refreshTokenStorage: "httpOnly-cookie",
    scopes: toStringArray(claims.scope),
    user: {
      id: toStringClaim(claims.sub),
      email: toStringClaim(claims.email),
      roles: toStringArray(claims.role) as AuthRole[],
      attributes: {
        tenantId: toStringClaim(claims.tenant_id),
        region: toStringClaim(claims.region),
        department: toStringClaim(claims.department),
        clearanceLevel: Number(claims.clearance_level ?? 0),
      },
    },
  };
}
