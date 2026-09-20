import { useAppContext } from '@/context'
import { DashboardPage } from '@/features/dashboard'
import { isAuthorized } from '@/services'
import { useTranslation } from 'react-i18next'

const dashboardPolicy = {
  anyRoles: ['super_admin', 'cto', 'finance_manager', 'inventory_manager'] as const,
  allScopes: ['dashboard:read'] as const,
}

export function AppRoutes() {
  const { session } = useAppContext()
  const { t } = useTranslation()

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
