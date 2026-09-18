import { FeatureCard } from '@/components'
import { appConfig, directoryBlueprint } from '@/config/appConfig'
import { useAppContext } from '@/context'
import { crmModule } from '@/features/crm'
import { dashboardModule } from '@/features/dashboard/pages/module'
import { financialModule } from '@/features/financial'
import { InventoryDashboardPage, inventoryModule } from '@/features/inventory'
import { useFeatureModules } from '@/hooks'
import { isAuthorized } from '@/services'
import { formatDirectoryName } from '@/utils'

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
  const { summary, session, security } = useAppContext()
  const modules = useFeatureModules()

  const canManageInventory = isAuthorized(session, inventoryWritePolicy)

  return (
    <main className="dashboard-page">
      <section className="hero-panel">
        <p className="eyebrow">Basic structure</p>
        <h1>{appConfig.name}</h1>
        <p className="hero-panel__summary">{summary}</p>
        <div className="hero-panel__tags">
          <span>Feature-driven modules</span>
          <span>Bulletproof React principles</span>
          <span>Strict TypeScript + path aliases</span>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel panel--full">
          <div className="panel__header">
            <h2>Enterprise security baseline</h2>
            <p>
              Auth provider: <strong>{security.authentication.provider}</strong> · Access token TTL:{' '}
              <strong>{security.authentication.accessTokenTtlMinutes} min</strong> · Refresh token:{' '}
              <strong>{security.authentication.refreshTokenStorage}</strong>
            </p>
          </div>
          <ul className="rules-list">
            <li>
              Signed in as <code>{session.user.email}</code> with role(s){' '}
              <code>{session.user.roles.join(', ')}</code>
            </li>
            <li>
              Authorization model: <code>{security.authorization.model}</code>
            </li>
            <li>
              Inventory write permission:{' '}
              <strong>{canManageInventory ? 'granted' : 'denied'}</strong> (RBAC + ABAC)
            </li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>Recommended src layout</h2>
            <p>Each directory now has a dedicated home in the codebase.</p>
          </div>
          <div className="directory-list">
            {directoryBlueprint.map((node) => (
              <div key={node.name} className="directory-list__item">
                <code>{formatDirectoryName(node.name)}</code>
                <p>{node.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>ERP feature modules</h2>
            <p>
              Each domain is treated as a mini application with a small public contract
              exposed through its barrel export.
            </p>
          </div>
          <div className="card-grid">
            {modules.map((module) => (
              <FeatureCard key={module.id} module={module} />
            ))}
          </div>
        </article>

        <article className="panel panel--full">
          <div className="panel__header">
            <h2>Inventory feature anatomy</h2>
            <p>
              The inventory module is the reference implementation for a self-contained
              feature.
            </p>
          </div>
          <InventoryDashboardPage />
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>Golden rules</h2>
          </div>
          <ul className="rules-list">
            <li>Use <code>@/</code> imports instead of fragile relative paths.</li>
            <li>Keep business logic inside hooks, APIs, and utilities instead of JSX.</li>
            <li>Export only the public API of each feature through its barrel file.</li>
            <li>Reserve shared state for providers and cross-feature concerns.</li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h2>Module snapshot</h2>
            <p>Representative ERP domains available for extension.</p>
          </div>
          <ul className="module-list">
            {[dashboardModule, financialModule, inventoryModule, crmModule].map((module) => (
              <li key={module.id}>
                <strong>{module.name}</strong>
                <span>{module.description}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
