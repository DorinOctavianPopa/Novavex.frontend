import { useCallback, useMemo, useState } from 'react'

import { AppContext } from '@/context/AppContext'
import { appConfig, demoSession } from '@/config/appConfig'
import type { AuthSession, SignInRequest } from '@/types'

const simulatedNetworkDelayMs = 900

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [session, setSession] = useState<AuthSession | null>(null)

  const signIn = useCallback(async ({ email, password }: SignInRequest) => {
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, simulatedNetworkDelayMs)
    })

    void password

    setSession({
      ...demoSession,
      user: {
        ...demoSession.user,
        email,
      },
    })
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo(() => ({
    ...appConfig,
    session,
    signIn,
    signOut,
  }), [session, signIn, signOut])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
