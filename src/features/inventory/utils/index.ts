export function formatStockHealth(
  lowStockItems: number,
  translate: (key: string, options?: Record<string, number>) => string,
) {
  return lowStockItems === 0
    ? translate('dashboard.inventory.healthyStock')
    : translate('dashboard.inventory.replenishStock', { count: lowStockItems })
}
