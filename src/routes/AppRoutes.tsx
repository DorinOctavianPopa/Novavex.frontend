import { useAppContext } from '@/context'
import { AuthenticationPage } from '@/features/authentication'
import { DashboardPage } from '@/features/dashboard'
import { isAuthorized } from '@/services'
import { useTranslation } from 'react-i18next'

const dashboardPolicy = {
  anyRoles: ['super_admin', 'cto', 'finance_manager', 'inventory_manager'] as const,
  allScopes: ['dashboard:read'] as const,
}

export function AppRoutes() {
  const { session, signIn } = useAppContext()
  const { t } = useTranslation()

  if (!session?.isAuthenticated) {
    return <AuthenticationPage onAuthenticate={signIn} />
  }

  if (!isAuthorized(session, dashboardPolicy)) {
    return (
      <main className="dashboard-page" aria-live="polite">
        <h1>{t('auth.accessDenied')}</h1>
        <p>{t('auth.noPermission')}</p>
      </main>
    )
  }

  return <DashboardPage />
}
