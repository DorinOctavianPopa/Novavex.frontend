import { crmModule } from '@/features/crm'
import { dashboardModule } from '@/features/dashboard/pages/module'
import { financialModule } from '@/features/financial'
import { inventoryModule } from '@/features/inventory'

export function useFeatureModules() {
  return [dashboardModule, financialModule, inventoryModule, crmModule] as const
}
