export function getStockHealthMessage(lowStockItems: number) {
  return lowStockItems === 0
    ? { key: 'dashboard.inventory.healthyStock' as const }
    : { key: 'dashboard.inventory.replenishStock' as const, count: lowStockItems }
}
