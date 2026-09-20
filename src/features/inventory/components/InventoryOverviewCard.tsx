import type { InventorySummary } from '@/features/inventory/types'
import { getStockHealthMessage } from '@/features/inventory/utils'
import { useTranslation } from 'react-i18next'

interface InventoryOverviewCardProps {
  readonly summary: InventorySummary
}

export function InventoryOverviewCard({ summary }: InventoryOverviewCardProps) {
  const { t } = useTranslation()
  const stockHealthMessage = getStockHealthMessage(summary.lowStockItems)

  return (
    <div className="inventory-card">
      <div>
        <p className="eyebrow">{t('dashboard.inventory.previewEyebrow')}</p>
        <h3>{t('dashboard.inventory.previewTitle')}</h3>
      </div>
      <dl className="inventory-card__metrics">
        <div>
          <dt>{t('dashboard.inventory.totalItems')}</dt>
          <dd>{summary.totalItems}</dd>
        </div>
        <div>
          <dt>{t('dashboard.inventory.lowStock')}</dt>
          <dd>{summary.lowStockItems}</dd>
        </div>
        <div>
          <dt>{t('dashboard.inventory.warehouses')}</dt>
          <dd>{summary.warehouseCount}</dd>
        </div>
      </dl>
      <p>{t(stockHealthMessage.key, stockHealthMessage)}</p>
    </div>
  )
}
