import type { DirectoryNode } from '@/types'

export const appConfig = {
  name: 'Novavex ERP Frontend',
  summary:
    'Feature-driven React architecture for flexible ERP modules and independent delivery.',
} as const

export const directoryBlueprint: readonly DirectoryNode[] = [
  { name: 'assets/', description: 'Global static images, icons and other shared files.' },
  { name: 'components/', description: 'Reusable UI building blocks shared across modules.' },
  { name: 'config/', description: 'Application-wide configuration and architecture metadata.' },
  { name: 'context/', description: 'Global React contexts such as auth or theme state.' },
  { name: 'features/', description: 'Self-contained ERP domains that behave like mini apps.' },
  { name: 'hooks/', description: 'Reusable hooks that keep view components light.' },
  { name: 'lib/', description: 'Library integration points such as API clients or query setup.' },
  { name: 'providers/', description: 'Top-level providers that compose global application state.' },
  { name: 'routes/', description: 'Application routing entry points and route composition.' },
  { name: 'services/', description: 'Cross-feature service functions when a module should not own them.' },
  { name: 'types/', description: 'Global TypeScript contracts shared across features.' },
  { name: 'utils/', description: 'Pure helper functions reused in multiple areas.' },
] as const
