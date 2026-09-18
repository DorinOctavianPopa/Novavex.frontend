import { useState } from "react";

import { appConfig, demoSession } from "@/config/appConfig";
import { AppContext, appContextValue } from "@/context/AppContext";
import type { AuthSession } from "@/types";

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<AuthSession>(appContextValue.session);

  function signIn(email: string, password: string) {
    if (!email.trim() || !password) {
      return;
    }

    setSession({
      ...demoSession,
      user: { ...demoSession.user, email: email.trim() },
    });
  }

  function signOut() {
    setSession(appContextValue.session);
  }

  return (
    <AppContext.Provider value={{ ...appConfig, session, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  );
}
