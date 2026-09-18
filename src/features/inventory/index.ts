import type { FeatureModule } from '@/types'

export { InventoryDashboardPage } from '@/features/inventory/pages/InventoryDashboardPage'
export type { InventorySummary } from '@/features/inventory/types'

export const inventoryModule: FeatureModule = {
  id: 'inventory',
  name: 'Inventory',
  path: 'src/features/inventory',
  description: 'Self-contained stock and warehouse workflows with their own API, hooks, and types.',
  status: 'ready',
}
