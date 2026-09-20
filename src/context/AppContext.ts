import { createContext } from "react";

import { appConfig, demoSession } from "@/config/appConfig";
import type { AppContextValue } from "@/types";

export const unauthenticatedSession = {
  ...demoSession,
  isAuthenticated: false,
  accessToken: "",
} as const;

export const appContextValue: AppContextValue = {
  ...appConfig,
  session: unauthenticatedSession,
  signIn: () => false,
  signOut: () => undefined,
};

export const AppContext = createContext(appContextValue);
