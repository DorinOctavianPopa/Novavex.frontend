import { createContext } from 'react'

import { appConfig } from '@/config/appConfig'
import type { AppContextValue } from '@/types'

export const appContextValue: AppContextValue = {
  ...appConfig,
  session: null,
  signIn: async () => undefined,
  signOut: () => undefined,
}

export const AppContext = createContext(appContextValue)
