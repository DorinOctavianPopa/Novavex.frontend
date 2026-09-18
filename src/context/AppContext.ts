import { createContext } from 'react'

import { appConfig, demoSession } from '@/config/appConfig'
import type { AppContextValue } from '@/types'

export const appContextValue: AppContextValue = {
  ...appConfig,
  session: demoSession,
}

export const AppContext = createContext(appContextValue)
