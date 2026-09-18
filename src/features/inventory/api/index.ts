import type { InventorySummary } from '@/features/inventory/types'

export function getInventorySummary(): InventorySummary {
  return {
    totalItems: 128,
    lowStockItems: 7,
    warehouseCount: 3,
  }
}
