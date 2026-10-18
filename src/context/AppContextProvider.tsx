import { useCallback, useMemo, useState } from "react";

import { AppContext } from "@/context/AppContext";
import {
  appConfig,
  demoSession,
  demoSignInCredentials,
} from "@/config/appConfig";
import { SignInError, SignUpError } from "@/types";
import type { AuthSession, SignInRequest, SignUpRequest } from "@/types";

const simulatedNetworkDelayMs = 900;

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const signIn = useCallback(async ({ email, password }: SignInRequest) => {
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, simulatedNetworkDelayMs);
    });

    if (
      email.trim().toLowerCase() !==
        demoSignInCredentials.email.toLowerCase() ||
      password !== demoSignInCredentials.password
    ) {
      throw new SignInError("invalid-credentials");
    }

    setSession({
      ...demoSession,
      user: {
        ...demoSession.user,
        email: email.trim(),
      },
    });
  }, []);

  const signUp = useCallback(async ({ email }: SignUpRequest) => {
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, simulatedNetworkDelayMs);
    });

    if (
      email.trim().toLowerCase() === demoSignInCredentials.email.toLowerCase()
    ) {
      throw new SignUpError("email-in-use");
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      ...appConfig,
      session,
      signIn,
      signUp,
      signOut,
    }),
    [session, signIn, signUp, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
