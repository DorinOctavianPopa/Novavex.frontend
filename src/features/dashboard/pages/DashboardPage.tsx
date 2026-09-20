import { FeatureCard } from '@/components'
import { directoryBlueprint } from '@/config/appConfig'
import { useAppContext } from '@/context'
import { crmModule } from '@/features/crm'
import { dashboardModule } from '@/features/dashboard/pages/module'
import { financialModule } from '@/features/financial'
import { InventoryDashboardPage, inventoryModule } from '@/features/inventory'
import { useFeatureModules } from '@/hooks'
import { isAuthorized } from '@/services'
import { formatDirectoryName } from '@/utils'
import { useTranslation } from 'react-i18next'

import './DashboardPage.css'

const inventoryWritePolicy = {
  anyRoles: ['super_admin', 'cto', 'inventory_manager'] as const,
  allScopes: ['inventory:write'] as const,
  attributeRules: [
    { key: 'department', equals: 'operations' },
    { key: 'region', equals: 'eu' },
  ] as const,
}

export function DashboardPage() {
  const { session, security } = useAppContext()
  const { i18n, t } = useTranslation()
  const modules = useFeatureModules()
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('ro')
    ? 'ro'
    : 'en'
  const heroTags = t('dashboard.hero.tags', { returnObjects: true }) as string[]
  const rules = t('dashboard.rules.items', { returnObjects: true }) as string[]

  const canManageInventory = isAuthorized(session, inventoryWritePolicy)

  return (
    <main className="dashboard-page">
      <section className="hero-panel">
        <div className="hero-panel__top">
          <p className="eyebrow">{t('dashboard.hero.eyebrow')}</p>
          <label className="language-switcher">
            <span>{t('language.label')}</span>
            <select
              value={activeLanguage}
              onChange={(event) => {
                void i18n.changeLanguage(event.target.value)
              }}
            >
              <option value="en">{t('language.options.en')}</option>
              <option value="ro">{t('language.options.ro')}</option>
            </select>
          </label>
        </div>
        <h1>{t('app.name')}</h1>
        <p className="hero-panel__summary">{t('app.summary')}</p>
        <div className="hero-panel__tags">
          {heroTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t('dashboard.security.title')}</h2>
            <p>
              {t('dashboard.security.authProvider')} <strong>{security.authentication.provider}</strong> ·{' '}
              {t('dashboard.security.accessTokenTtl')} <strong>{security.authentication.accessTokenTtlMinutes} {t('common.minutes')}</strong> ·{' '}
              {t('dashboard.security.refreshToken')} <strong>{security.authentication.refreshTokenStorage}</strong>
            </p>
          </div>
          <ul className="rules-list">
            <li>
              {t('dashboard.security.signedInAs')} <code>{session.user.email}</code>{' '}
              {t('dashboard.security.withRoles')} <code>{session.user.roles.join(', ')}</code>
            </li>
            <li>
              {t('dashboard.security.authorizationModel')} <code>{security.authorization.model}</code>
            </li>
            <li>
              {t('dashboard.security.inventoryWritePermission')}{' '}
              <strong>
                {canManageInventory ? t('common.permissionGranted') : t('common.permissionDenied')}
              </strong>{' '}
              {t('dashboard.security.rbacAbac')}
            </li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>{t('dashboard.layout.title')}</h2>
            <p>{t('dashboard.layout.description')}</p>
          </div>
          <div className="directory-list">
            {directoryBlueprint.map((node) => (
              <div key={node.name} className="directory-list__item">
                <code>{formatDirectoryName(node.name)}</code>
                <p>{t(`directory.${node.name.replace('/', '')}`)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>{t('dashboard.featureModules.title')}</h2>
            <p>{t('dashboard.featureModules.description')}</p>
          </div>
          <div className="card-grid">
            {modules.map((module) => (
              <FeatureCard key={module.id} module={module} />
            ))}
          </div>
        </article>

        <article className="panel panel--full">
          <div className="panel__header">
            <h2>{t('dashboard.inventory.title')}</h2>
            <p>{t('dashboard.inventory.description')}</p>
          </div>
          <InventoryDashboardPage />
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>{t('dashboard.rules.title')}</h2>
          </div>
          <ul className="rules-list">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>{t('dashboard.snapshot.title')}</h2>
            <p>{t('dashboard.snapshot.description')}</p>
          </div>
          <ul className="module-list">
            {[dashboardModule, financialModule, inventoryModule, crmModule].map((module) => (
              <li key={module.id}>
                <strong>{t(`modules.${module.id}.name`)}</strong>
                <span>{t(`modules.${module.id}.description`)}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
