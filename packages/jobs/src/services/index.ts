import type { AdapterFetchParams } from '../utils'
import { buildJobFingerprint } from '../utils'
import type { AdapterTelemetry } from '../adapters/base'
import type { NormalizedOrganization } from '../domain/organization'
import type {
  IngestedJob,
  JobIngestionRepository,
  JobIngestionResult,
  JobIngestionRunnerOptions,
  JobIngestionSummary,
} from './types'

const dedupeWarnings = (existing: Set<string>, warnings?: string[]) => {
  if (!warnings?.length) return
  for (const warning of warnings) {
    existing.add(warning)
  }
}

const mergeMetadata = (
  target: Record<string, unknown> | undefined,
  source?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!source) return target
  return { ...(target ?? {}), ...source }
}

const toIsoString = (value: Date): string => value.toISOString()

const sanitizeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return toIsoString(value)
  }
  if (value instanceof Set) {
    return Array.from(value.values()).map((entry) => sanitizeValue(entry))
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, entry]) => [String(key), sanitizeValue(entry)])
    )
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeValue(entry),
      ])
    )
  }
  return value
}

const sanitizeParameters = (params?: AdapterFetchParams): Record<string, unknown> => {
  if (!params) return {}
  const { signal, ...rest } = params
  return sanitizeValue(rest) as Record<string, unknown>
}

const getOrganizationKey = (organization: NormalizedOrganization): string => {
  return (
    organization.id ??
    organization.identifier?.externalId ??
    organization.identifier?.slug ??
    organization.name
  )
}

const buildTelemetry = (
  source: string,
  requestCount: number,
  itemsReceived: number,
  durationMs?: number,
  warnings?: Set<string>,
  rateLimit?: AdapterTelemetry['rateLimit'],
  metadata?: Record<string, unknown>
): AdapterTelemetry => ({
  source,
  requestCount,
  itemsReceived,
  durationMs,
  warnings: Array.from(warnings ?? []),
  rateLimit,
  metadata,
})

const createPageParams = (
  baseParams: AdapterFetchParams | undefined,
  cursor: string | undefined
): AdapterFetchParams | undefined => {
  if (!baseParams && cursor === undefined) {
    return undefined
  }

  const pagination =
    cursor !== undefined ? { ...(baseParams?.pagination ?? {}), cursor } : baseParams?.pagination

  if (!baseParams) {
    return pagination ? { pagination } : undefined
  }

  return {
    ...baseParams,
    ...(pagination ? { pagination } : {}),
  }
}

export const runJobIngestion = async (
  options: JobIngestionRunnerOptions
): Promise<JobIngestionResult> => {
  const { adapter, repository, fetchParams, now = () => new Date() } = options

  const startedAt = now()
  const run = await repository.startRun({
    adapter: adapter.constructor?.name ?? adapter.source,
    provider: adapter.source,
    parameters: sanitizeParameters(fetchParams),
    startedAt,
  })

  const jobMap = new Map<string, IngestedJob>()
  const organizationMap = new Map<string, NormalizedOrganization>()
  const warningSet = new Set<string>()
  let metadata: Record<string, unknown> | undefined
  let rateLimit: AdapterTelemetry['rateLimit']
  let totalDuration = 0
  let hasDuration = false
  let totalFetched = 0
  let requestCount = 0
  let itemsReceived = 0

  const seenCursors = new Set<string>()
  let cursor = fetchParams?.pagination?.cursor
  if (cursor !== undefined) {
    seenCursors.add(cursor)
  }

  try {
    // Always perform at least one pull, updating cursor for subsequent iterations.
    while (true) {
      const pageParams = createPageParams(fetchParams, cursor) ?? {}
      const result = await adapter.pullListings(pageParams)

      requestCount += result.telemetry.requestCount ?? 0
      itemsReceived += result.telemetry.itemsReceived ?? 0
      if (result.telemetry.durationMs !== undefined) {
        totalDuration += result.telemetry.durationMs
        hasDuration = true
      }

      dedupeWarnings(warningSet, result.telemetry.warnings)
      metadata = mergeMetadata(metadata, result.telemetry.metadata)
      if (result.telemetry.rateLimit) {
        rateLimit = result.telemetry.rateLimit
      }

      totalFetched += result.jobs.length

      for (const job of result.jobs) {
        const fingerprint = buildJobFingerprint(job)
        if (!jobMap.has(fingerprint)) {
          jobMap.set(fingerprint, { job, fingerprint })
        }
        const orgKey = getOrganizationKey(job.organization)
        if (!organizationMap.has(orgKey)) {
          organizationMap.set(orgKey, job.organization)
        }
      }

      for (const organization of result.organizations ?? []) {
        const orgKey = getOrganizationKey(organization)
        if (!organizationMap.has(orgKey)) {
          organizationMap.set(orgKey, organization)
        }
      }

      const nextCursor = result.nextCursor
      if (nextCursor === undefined || nextCursor === null || nextCursor === '') {
        break
      }

      if (seenCursors.has(nextCursor)) {
        break
      }

      seenCursors.add(nextCursor)
      cursor = nextCursor
    }

    const ingestedJobs = Array.from(jobMap.values())
    const organizations = Array.from(organizationMap.values())

    const persistence = await repository.persistIngestion({
      runId: run.id,
      provider: adapter.source,
      jobs: ingestedJobs,
      organizations,
      startedAt: run.startedAt ?? startedAt,
    })

    const summary: JobIngestionSummary = {
      fetched: totalFetched,
      processed: ingestedJobs.length,
      deduplicated: totalFetched - ingestedJobs.length,
      created: persistence.created,
      updated: persistence.updated,
      closed: persistence.closed,
    }

    const telemetry = buildTelemetry(
      adapter.source,
      requestCount,
      itemsReceived,
      hasDuration ? totalDuration : undefined,
      warningSet,
      rateLimit,
      metadata
    )

    const finishedAt = now()

    await repository.completeRun({
      runId: run.id,
      telemetry,
      summary,
      finishedAt,
    })

    return {
      runId: run.id,
      jobs: ingestedJobs.map((entry) => entry.job),
      organizations,
      telemetry,
      summary,
    }
  } catch (error) {
    const finishedAt = now()
    await repository.failRun({
      runId: run.id,
      error,
      finishedAt,
    })
    throw error
  }
}

export * from './types'
export { SupabaseJobIngestionRepository } from './supabase-repository'
