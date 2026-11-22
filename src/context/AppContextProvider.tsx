import { useCallback, useMemo, useRef, useState } from "react";

import { AppContext } from "@/context/AppContext";
import {
  appConfig,
  demoSession,
  demoSignInCredentials,
} from "@/config/appConfig";
import { MfaError, SignInError, SignUpError } from "@/types";
import type {
  AuthSession,
  MfaChallenge,
  SignInRequest,
  SignUpRequest,
} from "@/types";

const simulatedNetworkDelayMs = 900;
const mfaCodeLength = 6;
const mfaCodeTtlMs = 5 * 60 * 1000;

interface PendingMfaVerification {
  readonly email: string;
  readonly code: string;
}

function delay(durationMs: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function generateMfaCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const pendingVerificationRef = useRef<PendingMfaVerification | null>(null);

  const signIn = useCallback(async ({ email, password }: SignInRequest) => {
    await delay(simulatedNetworkDelayMs);

    if (
      email.trim().toLowerCase() !==
        demoSignInCredentials.email.toLowerCase() ||
      password !== demoSignInCredentials.password
    ) {
      throw new SignInError("invalid-credentials");
    }

    const normalizedEmail = email.trim();
    const code = generateMfaCode();

    pendingVerificationRef.current = { email: normalizedEmail, code };
    setMfaChallenge({
      email: normalizedEmail,
      expiresAt: new Date(Date.now() + mfaCodeTtlMs).toISOString(),
      codeLength: mfaCodeLength,
      previewCode: code,
    });
  }, []);

  const verifyMfaCode = useCallback(
    async (code: string) => {
      await delay(simulatedNetworkDelayMs);

      const pending = pendingVerificationRef.current;

      if (!pending || !mfaChallenge) {
        throw new MfaError("expired-code");
      }

      if (new Date(mfaChallenge.expiresAt).getTime() < Date.now()) {
        pendingVerificationRef.current = null;
        setMfaChallenge(null);
        throw new MfaError("expired-code");
      }

      if (code.trim() !== pending.code) {
        throw new MfaError("invalid-code");
      }

      setSession({
        ...demoSession,
        user: {
          ...demoSession.user,
          email: pending.email,
        },
      });
      pendingVerificationRef.current = null;
      setMfaChallenge(null);
    },
    [mfaChallenge],
  );

  const resendMfaCode = useCallback(async () => {
    const pending = pendingVerificationRef.current;

    if (!pending) {
      return;
    }

    await delay(simulatedNetworkDelayMs);

    const code = generateMfaCode();
    const expiresAt = new Date(Date.now() + mfaCodeTtlMs).toISOString();

    pendingVerificationRef.current = { ...pending, code };
    setMfaChallenge((current) =>
      current ? { ...current, expiresAt, previewCode: code } : current,
    );
  }, []);

  const cancelMfaChallenge = useCallback(() => {
    pendingVerificationRef.current = null;
    setMfaChallenge(null);
  }, []);

  const signUp = useCallback(async ({ email }: SignUpRequest) => {
    await delay(simulatedNetworkDelayMs);

    if (
      email.trim().toLowerCase() === demoSignInCredentials.email.toLowerCase()
    ) {
      throw new SignUpError("email-in-use");
    }
  }, []);

  const signOut = useCallback(() => {
    pendingVerificationRef.current = null;
    setMfaChallenge(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      ...appConfig,
      session,
      mfaChallenge,
      signIn,
      verifyMfaCode,
      resendMfaCode,
      cancelMfaChallenge,
      signUp,
      signOut,
    }),
    [
      session,
      mfaChallenge,
      signIn,
      verifyMfaCode,
      resendMfaCode,
      cancelMfaChallenge,
      signUp,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
