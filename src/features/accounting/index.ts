import type { FeatureModule } from '@/types'

export { AccountingPage } from './AccountingPage'

export const accountingModule: FeatureModule = {
  id: 'accounting',
  name: 'Accounting',
  path: 'src/features/accounting',
  description: 'Chart of accounts, journal entries, settings and reports.',
  status: 'ready',
  route: '/accounting',
}
