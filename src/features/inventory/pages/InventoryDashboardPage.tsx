import { InventoryOverviewCard } from '@/features/inventory/components'
import { useInventorySummary } from '@/features/inventory/hooks'

export function InventoryDashboardPage() {
  const summary = useInventorySummary()

  return <InventoryOverviewCard summary={summary} />
}
