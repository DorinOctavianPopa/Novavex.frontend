import { AppContext } from '@/context/AppContext'
import { appConfig } from '@/config/appConfig'

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppContext.Provider value={appConfig}>{children}</AppContext.Provider>
}
