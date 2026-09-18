import type { InventorySummary } from '@/features/inventory/types'
import { formatStockHealth } from '@/features/inventory/utils'

interface InventoryOverviewCardProps {
  readonly summary: InventorySummary
}

export function InventoryOverviewCard({ summary }: InventoryOverviewCardProps) {
  return (
    <div className="inventory-card">
      <div>
        <p className="eyebrow">api/ + hooks/ + utils/</p>
        <h3>Inventory feature preview</h3>
      </div>
      <dl className="inventory-card__metrics">
        <div>
          <dt>Total items</dt>
          <dd>{summary.totalItems}</dd>
        </div>
        <div>
          <dt>Low stock</dt>
          <dd>{summary.lowStockItems}</dd>
        </div>
        <div>
          <dt>Warehouses</dt>
          <dd>{summary.warehouseCount}</dd>
        </div>
      </dl>
      <p>{formatStockHealth(summary.lowStockItems)}</p>
    </div>
  )
}
