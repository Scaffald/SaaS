import type { NormalizedJob } from '../domain/job'
import type { NormalizedOrganization } from '../domain/organization'
import type { AdapterFetchParams } from '../utils'

export interface RateLimitTelemetry {
  limit?: number
  remaining?: number
  resetAt?: Date
  periodSeconds?: number
}

export interface AdapterTelemetry {
  source: string
  requestCount: number
  itemsReceived: number
  durationMs?: number
  warnings?: string[]
  rateLimit?: RateLimitTelemetry
  metadata?: Record<string, unknown>
}

export interface AdapterPullResult {
  jobs: NormalizedJob[]
  organizations: NormalizedOrganization[]
  nextCursor?: string
  telemetry: AdapterTelemetry
}

export interface HydrateCompanyParams {
  organization: NormalizedOrganization
  signal?: AbortSignal
  metadata?: Record<string, unknown>
}

export interface HydrateCompanyResult {
  organization: NormalizedOrganization
  telemetry: AdapterTelemetry
}

export abstract class JobSourceAdapter {
  public readonly source: string

  protected constructor(source: string) {
    this.source = source
  }

  abstract pullListings(params: AdapterFetchParams): Promise<AdapterPullResult>

  abstract hydrateCompany(params: HydrateCompanyParams): Promise<HydrateCompanyResult>

  protected createTelemetry(
    overrides: Partial<Omit<AdapterTelemetry, 'source'>> = {},
  ): AdapterTelemetry {
    return {
      source: this.source,
      requestCount: overrides.requestCount ?? 0,
      itemsReceived: overrides.itemsReceived ?? 0,
      durationMs: overrides.durationMs,
      warnings: overrides.warnings ?? [],
      rateLimit: overrides.rateLimit,
      metadata: overrides.metadata,
    }
  }
}
