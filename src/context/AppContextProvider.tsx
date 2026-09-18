import { AppContext, appContextValue } from '@/context/AppContext'

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppContext.Provider value={appContextValue}>{children}</AppContext.Provider>
}
