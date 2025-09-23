import type { NormalizedJob, NormalizedOrganization } from '../domain/types'

export interface AdapterFilters {
  keywords?: string[]
  location?: string
  radius?: number
}

export interface AdapterPagination {
  page: number
  pageSize: number
}

export interface AdapterConfig extends AdapterFilters {
  page: number
  pageSize: number
}

export interface AdapterMeta<TConfig extends AdapterConfig = AdapterConfig> {
  source: string
  requestedAt: string
  durationMs: number
  returnedCount: number
  totalCount?: number
  config: TConfig
}

export interface AdapterResult<TConfig extends AdapterConfig = AdapterConfig> {
  jobs: NormalizedJob[]
  organizations: NormalizedOrganization[]
  meta: AdapterMeta<TConfig>
  rawResponse?: unknown
}

export interface AdapterRunOptions {
  signal?: AbortSignal
}

export interface JobSourceAdapter<TConfig extends AdapterConfig = AdapterConfig> {
  readonly name: string
  readonly source: string
  getDefaultConfig(env?: NodeJS.ProcessEnv): TConfig
  sync(
    overrides?: Partial<Omit<TConfig, 'page' | 'pageSize'>> & Partial<AdapterPagination>,
    options?: AdapterRunOptions,
  ): Promise<AdapterResult<TConfig>>
}
