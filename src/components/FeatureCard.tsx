import type { FeatureModule } from '@/types'
import { useTranslation } from 'react-i18next'

interface FeatureCardProps {
  readonly module: FeatureModule
}

export function FeatureCard({ module }: FeatureCardProps) {
  const { t } = useTranslation()

  return (
    <article className="card">
      <div className="card__header">
        <div>
          <p className="eyebrow">{module.path}</p>
          <h3>{t(`modules.${module.id}.name`)}</h3>
        </div>
        <span className={`status status--${module.status}`}>
          {t(`status.${module.status}`)}
        </span>
      </div>
      <p>{t(`modules.${module.id}.description`)}</p>
    </article>
  )
}
