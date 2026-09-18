export interface FeatureModule {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly description: string
  readonly status: 'ready' | 'planned'
}

export interface DirectoryNode {
  readonly name: string
  readonly description: string
}
