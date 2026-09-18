export function formatStockHealth(lowStockItems: number) {
  return lowStockItems === 0 ? 'Healthy stock levels' : `${lowStockItems} items need replenishment`
}
