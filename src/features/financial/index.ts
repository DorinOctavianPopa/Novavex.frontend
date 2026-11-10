import type { FeatureModule } from '@/types'

export { AccountingModulePage } from '@/features/financial/pages/AccountingModulePage'

export const financialModule: FeatureModule = {
  id: 'financial',
  name: 'Accounting',
  path: 'src/features/financial',
  description: 'Accounting, invoices, and ledger flows isolated from other domains.',
  status: 'planned',
  route: '/accounting',
}
