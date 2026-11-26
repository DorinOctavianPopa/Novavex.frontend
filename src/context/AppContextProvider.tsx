import { useCallback, useMemo, useRef, useState } from "react";

import { AppContext } from "@/context/AppContext";
import { appConfig } from "@/config/appConfig";
import {
  buildSessionFromAccessToken,
  completeSignUp,
  requestSignInChallenge,
  requestSignUpChallenge,
  verifySignInCode,
} from "@/features/authentication/api/loginApi";
import { MfaError, SignInError } from "@/types";
import type {
  AuthSession,
  MfaChallenge,
  SignInRequest,
  SignUpEmailRequest,
  SignUpVerificationRequest,
} from "@/types";

const mfaCodeLength = 6;

interface PendingSignIn {
  readonly email: string;
  readonly password: string;
  readonly challengeId: string;
  readonly expiresAt: string;
}

interface PendingSignUp {
  readonly email: string;
  readonly challengeId: string;
  readonly expiresAt: string;
}

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const pendingSignInRef = useRef<PendingSignIn | null>(null);
  const [signUpMfaChallenge, setSignUpMfaChallenge] =
    useState<MfaChallenge | null>(null);
  const pendingSignUpRef = useRef<PendingSignUp | null>(null);

  const signIn = useCallback(async ({ email, password }: SignInRequest) => {
    const normalizedEmail = email.trim();
    const challenge = await requestSignInChallenge(normalizedEmail, password);

    if (!challenge) {
      throw new SignInError("invalid-credentials");
    }

    pendingSignInRef.current = {
      email: normalizedEmail,
      password,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
    };
    setMfaChallenge({
      email: normalizedEmail,
      expiresAt: challenge.expiresAt,
      codeLength: mfaCodeLength,
    });
  }, []);

  const verifyMfaCode = useCallback(async (code: string) => {
    const pending = pendingSignInRef.current;

    if (!pending) {
      throw new MfaError("expired-code");
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      pendingSignInRef.current = null;
      setMfaChallenge(null);
      throw new MfaError("expired-code");
    }

    const token = await verifySignInCode(pending.challengeId, code.trim());

    if (!token) {
      throw new MfaError("invalid-code");
    }

    setSession(buildSessionFromAccessToken(token.accessToken, token.expiresAt));
    pendingSignInRef.current = null;
    setMfaChallenge(null);
  }, []);

  const resendMfaCode = useCallback(async () => {
    const pending = pendingSignInRef.current;

    if (!pending) {
      return;
    }

    const challenge = await requestSignInChallenge(
      pending.email,
      pending.password,
    );

    if (!challenge) {
      // Credentials stopped being valid between the original attempt and this resend.
      pendingSignInRef.current = null;
      setMfaChallenge(null);
      throw new SignInError("invalid-credentials");
    }

    pendingSignInRef.current = {
      ...pending,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
    };
    setMfaChallenge((current) =>
      current ? { ...current, expiresAt: challenge.expiresAt } : current,
    );
  }, []);

  const cancelMfaChallenge = useCallback(() => {
    pendingSignInRef.current = null;
    setMfaChallenge(null);
  }, []);

  const signUp = useCallback(async ({ email }: SignUpEmailRequest) => {
    const normalizedEmail = email.trim();
    const challenge = await requestSignUpChallenge(normalizedEmail);

    pendingSignUpRef.current = {
      email: normalizedEmail,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
    };
    setSignUpMfaChallenge({
      email: normalizedEmail,
      expiresAt: challenge.expiresAt,
      codeLength: mfaCodeLength,
    });
  }, []);

  const verifySignUpMfaCode = useCallback(
    async (request: SignUpVerificationRequest) => {
      const pending = pendingSignUpRef.current;

      if (!pending) {
        throw new MfaError("expired-code");
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        pendingSignUpRef.current = null;
        setSignUpMfaChallenge(null);
        throw new MfaError("expired-code");
      }

      const completed = await completeSignUp({
        challengeId: pending.challengeId,
        code: request.code.trim(),
        fullName: request.fullName.trim(),
        password: request.password,
      });

      if (!completed) {
        throw new MfaError("invalid-code");
      }

      pendingSignUpRef.current = null;
      setSignUpMfaChallenge(null);
    },
    [],
  );

  const resendSignUpMfaCode = useCallback(async () => {
    const pending = pendingSignUpRef.current;

    if (!pending) {
      return;
    }

    const challenge = await requestSignUpChallenge(pending.email);

    pendingSignUpRef.current = {
      ...pending,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
    };
    setSignUpMfaChallenge((current) =>
      current ? { ...current, expiresAt: challenge.expiresAt } : current,
    );
  }, []);

  const cancelSignUpMfaChallenge = useCallback(() => {
    pendingSignUpRef.current = null;
    setSignUpMfaChallenge(null);
  }, []);

  const signOut = useCallback(() => {
    pendingSignInRef.current = null;
    setMfaChallenge(null);
    pendingSignUpRef.current = null;
    setSignUpMfaChallenge(null);
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
      signUpMfaChallenge,
      signUp,
      verifySignUpMfaCode,
      resendSignUpMfaCode,
      cancelSignUpMfaChallenge,
      signOut,
    }),
    [
      session,
      mfaChallenge,
      signIn,
      verifyMfaCode,
      resendMfaCode,
      cancelMfaChallenge,
      signUpMfaChallenge,
      signUp,
      verifySignUpMfaCode,
      resendSignUpMfaCode,
      cancelSignUpMfaChallenge,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
