import { crmModule } from '@/features/crm'
import { dashboardModule } from '@/features/dashboard/pages/module'
import { financialModule } from '@/features/financial'
import { inventoryModule } from '@/features/inventory'
import { accountingModule } from '@/features/accounting'
import { organizationModule } from '@/features/organization'
import { userManagementModule } from '@/features/userManagement'

export function useFeatureModules() {
  return [
    dashboardModule,
    financialModule,
    inventoryModule,
    crmModule,
    accountingModule,
    userManagementModule,
    organizationModule,
  ] as const
}
