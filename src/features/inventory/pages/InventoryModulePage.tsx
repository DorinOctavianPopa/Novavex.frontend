import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { InventoryDashboardPage } from '@/features/inventory/pages/InventoryDashboardPage'

import './InventoryModulePage.css'

export function InventoryModulePage() {
  const { t } = useTranslation()

  return (
    <main className="inventory-page">
      <div className="inventory-page__header">
        <Link className="inventory-page__back-link" to="/">
          {t('inventoryPage.backToDashboard')}
        </Link>
        <p className="inventory-page__eyebrow">{t('inventoryPage.eyebrow')}</p>
        <h1>{t('inventoryPage.title')}</h1>
        <p className="inventory-page__description">{t('inventoryPage.description')}</p>
      </div>
      <InventoryDashboardPage />
    </main>
  )
}
