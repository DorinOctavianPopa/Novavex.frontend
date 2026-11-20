import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import './AccountingModulePage.css'

export function AccountingModulePage() {
  const { t } = useTranslation()

  return (
    <main className="accounting-page">
      <section className="accounting-page__panel">
        <Link className="accounting-page__back-link" to="/">
          {t('accountingPage.backToDashboard')}
        </Link>
        <p className="accounting-page__eyebrow">{t('accountingPage.eyebrow')}</p>
        <h1>{t('accountingPage.title')}</h1>
        <p className="accounting-page__description">
          {t('accountingPage.description')}
        </p>
      </section>
    </main>
  )
}
