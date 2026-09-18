import { useAppContext } from '@/context'
import { DashboardPage } from '@/features/dashboard'
import { isAuthorized } from '@/services'

const dashboardPolicy = {
  anyRoles: ['super_admin', 'cto', 'finance_manager', 'inventory_manager'] as const,
  allScopes: ['dashboard:read'] as const,
}

export function AppRoutes() {
  const { session } = useAppContext()

  if (!isAuthorized(session, dashboardPolicy)) {
    return <main className="dashboard-page">Access denied.</main>
  }

  return <DashboardPage />
}
