import type { FeatureModule } from '@/types'

interface FeatureCardProps {
  readonly module: FeatureModule
}

export function FeatureCard({ module }: FeatureCardProps) {
  return (
    <article className="card">
      <div className="card__header">
        <div>
          <p className="eyebrow">{module.path}</p>
          <h3>{module.name}</h3>
        </div>
        <span className={`status status--${module.status}`}>
          {module.status === 'ready' ? 'Ready' : 'Planned'}
        </span>
      </div>
      <p>{module.description}</p>
    </article>
  )
}
