import { ThemeProvider } from '@mui/material/styles'

import { AppContextProvider } from '@/context'
import { appTheme } from '@/theme'

export function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider theme={appTheme}>
      <AppContextProvider>{children}</AppContextProvider>
    </ThemeProvider>
  )
}
