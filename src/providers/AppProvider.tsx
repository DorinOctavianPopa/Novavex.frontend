import { AppContextProvider } from '@/context'

export function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppContextProvider>{children}</AppContextProvider>
}
