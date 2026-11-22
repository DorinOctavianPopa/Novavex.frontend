import { createContext } from "react";

import { appConfig } from "@/config/appConfig";
import type { AppContextValue } from "@/types";

export const appContextValue: AppContextValue = {
  ...appConfig,
  session: null,
  mfaChallenge: null,
  signIn: async () => undefined,
  verifyMfaCode: async () => undefined,
  resendMfaCode: async () => undefined,
  cancelMfaChallenge: () => undefined,
  signUpMfaChallenge: null,
  signUp: async () => undefined,
  verifySignUpMfaCode: async () => undefined,
  resendSignUpMfaCode: async () => undefined,
  cancelSignUpMfaChallenge: () => undefined,
  signOut: () => undefined,
};

export const AppContext = createContext(appContextValue);
