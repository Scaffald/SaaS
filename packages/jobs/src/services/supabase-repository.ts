import { createHash } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Location } from '../domain/common'
import type { NormalizedJob } from '../domain/job'
import type { NormalizedOrganization } from '../domain/organization'
import type {
  CompleteJobIngestRunParams,
  FailJobIngestRunParams,
  IngestedJob,
  JobIngestionRepository,
  JobIngestRunRecord,
  PersistJobIngestionParams,
  PersistJobIngestionResult,
  StartJobIngestRunParams,
} from './types'

const KNOWN_PROVIDERS = new Set([
  'manual',
  'indeed',
  'ziprecruiter',
  'linkedin',
  'greenhouse',
  'workday',
  'other',
])

const normalizeProvider = (provider?: string): string => {
  if (!provider) return 'other'
  const normalized = provider.toLowerCase()
  return KNOWN_PROVIDERS.has(normalized) ? normalized : 'other'
}

const toIso = (value: Date): string => value.toISOString()

const toNullableIso = (value?: string | Date | null): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return toIso(date)
}

const prepareJson = (value: unknown): unknown => {
  if (value instanceof Date) {
    return toIso(value)
  }
  if (value instanceof Set) {
    return Array.from(value.values()).map((entry) => prepareJson(entry))
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, entry]) => [String(key), prepareJson(entry)])
    )
  }
  if (Array.isArray(value)) {
    return value.map((entry) => prepareJson(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, prepareJson(entry)])
    )
  }
  return value
}

const serializeOrganizationSource = (
  organization: NormalizedOrganization,
  provider: string,
  timestampIso: string
) => {
  const externalId =
    organization.identifier?.externalId ?? organization.identifier?.slug ?? undefined
  if (!organization.id || !externalId) {
    return undefined
  }

  return {
    organization_id: organization.id,
    provider,
    external_organization_id: externalId,
    metadata: prepareJson(organization.metadata ?? {}),
    updated_at: timestampIso,
  }
}

const resolvePrimaryLocation = (job: NormalizedJob): Location | undefined => {
  if (job.primaryLocation) return job.primaryLocation
  if (job.locations?.length) return job.locations[0]
  return undefined
}

const formatLocation = (location?: Location): string | null => {
  if (!location) return null
  const parts = [location.city, location.region, location.countryCode ?? location.country]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

const normalizeRemoteOption = (job: NormalizedJob): string | null => {
  if (job.workplaceType) {
    return job.workplaceType
  }
  if (job.remote === true) return 'remote'
  if (job.remote === false) return 'onsite'
  return null
}

const buildJobPayload = (
  job: IngestedJob,
  provider: string,
  timestampIso: string
): Record<string, unknown> => {
  const { job: normalized, fingerprint } = job
  const externalId = normalized.identifier.externalId
  if (!externalId) {
    throw new Error('Normalized job is missing an external identifier')
  }
  if (!normalized.organization.id) {
    throw new Error(`Job ${externalId} is missing an organization id`)
  }

  const location = resolvePrimaryLocation(normalized)
  const payload: Record<string, unknown> = {
    source_provider: provider,
    external_id: externalId,
    external_url: normalized.url ?? normalized.identifier.url ?? null,
    title: normalized.title,
    description: normalized.description ?? normalized.summary ?? null,
    employment_type: normalized.employmentType ?? null,
    position_level: normalized.experienceLevel ?? null,
    remote_option: normalizeRemoteOption(normalized),
    organization_id: normalized.organization.id,
    status: normalized.status ?? 'open',
    compensation: prepareJson(normalized.compensation ?? null),
    posted_at: toNullableIso(normalized.postedAt ?? null),
    closes_at: toNullableIso(normalized.closesAt ?? null),
    source_posted_at: toNullableIso(normalized.postedAt ?? null),
    source_updated_at: toNullableIso(normalized.updatedAt ?? null),
    last_seen_at: timestampIso,
    updated_at: timestampIso,
    location: formatLocation(location),
    address: prepareJson(location ?? null),
    raw_payload: prepareJson({ fingerprint, normalizedJob: normalized }),
  }

  if (normalized.id) {
    payload.id = normalized.id
  }

  return payload
}

const buildJobSourceRecord = (
  job: IngestedJob,
  provider: string,
  jobId: string,
  firstSeenIso: string,
  timestampIso: string
) => {
  const preparedJob = prepareJson(job.job)
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(preparedJob))
    .digest('hex')

  return {
    job_id: jobId,
    provider,
    external_id: job.job.identifier.externalId,
    content_hash: job.fingerprint,
    payload_hash: payloadHash,
    first_seen_at: firstSeenIso,
    last_seen_at: timestampIso,
    updated_at: timestampIso,
  }
}

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return prepareJson(error)
}

export class SupabaseJobIngestionRepository implements JobIngestionRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly now: () => Date = () => new Date()
  ) {}

  async startRun(params: StartJobIngestRunParams): Promise<JobIngestRunRecord> {
    const provider = normalizeProvider(params.provider)
    const startedAtIso = toIso(params.startedAt)
    const { data, error } = await this.client
      .from('job_ingest_runs' as any)
      .insert({
        adapter: params.adapter,
        provider,
        parameters: prepareJson(params.parameters ?? {}),
        status: 'running',
        started_at: startedAtIso,
      })
      .select('id, started_at')
      .single()

    if (error) {
      throw new Error(`Failed to create job ingest run: ${error.message}`)
    }

    return {
      id: data.id,
      startedAt: new Date(data.started_at),
    }
  }

  async persistIngestion(
    params: PersistJobIngestionParams
  ): Promise<PersistJobIngestionResult> {
    const provider = normalizeProvider(params.provider)
    const timestamp = this.now()
    const timestampIso = toIso(timestamp)
    const startIso = toIso(params.startedAt)

    const organizationRecords = params.organizations
      .map((organization) => serializeOrganizationSource(organization, provider, timestampIso))
      .filter((record): record is Record<string, unknown> => Boolean(record))

    if (organizationRecords.length) {
      const { error } = await this.client
        .from('organization_sources' as any)
        .upsert(organizationRecords, { onConflict: 'provider,external_organization_id' })

      if (error) {
        throw new Error(`Failed to upsert organization sources: ${error.message}`)
      }
    }

    const ingestedJobs = params.jobs
    const externalIds = Array.from(
      new Set(
        ingestedJobs
          .map((entry) => entry.job.identifier.externalId)
          .filter((id): id is string => Boolean(id))
      )
    )

    const existingJobMap = new Map<string, string>()
    if (externalIds.length) {
      const { data, error } = await this.client
        .from('jobs' as any)
        .select('id, external_id')
        .eq('source_provider', provider)
        .in('external_id', externalIds)

      if (error) {
        throw new Error(`Failed to lookup existing jobs: ${error.message}`)
      }

      for (const row of data ?? []) {
        if (row.external_id && row.id) {
          existingJobMap.set(row.external_id, row.id)
        }
      }
    }

    const jobPayloads = ingestedJobs.map((entry) => buildJobPayload(entry, provider, timestampIso))

    let created = 0
    const updatedJobMap = new Map(existingJobMap)

    if (jobPayloads.length) {
      created = jobPayloads.filter((payload) => {
        const externalId = payload.external_id as string | undefined
        return externalId ? !existingJobMap.has(externalId) : false
      }).length

      const { data, error } = await this.client
        .from('jobs' as any)
        .upsert(jobPayloads, { onConflict: 'source_provider,external_id' })
        .select('id, external_id')

      if (error) {
        throw new Error(`Failed to upsert jobs: ${error.message}`)
      }

      for (const row of data ?? []) {
        if (row.external_id && row.id) {
          updatedJobMap.set(row.external_id, row.id)
        }
      }
    }

    const existingSourceRecords = new Map<string, string>()
    if (externalIds.length) {
      const { data, error } = await this.client
        .from('job_source_records' as any)
        .select('external_id, first_seen_at')
        .eq('provider', provider)
        .in('external_id', externalIds)

      if (error) {
        throw new Error(`Failed to lookup job source records: ${error.message}`)
      }

      for (const row of data ?? []) {
        if (row.external_id && row.first_seen_at) {
          existingSourceRecords.set(row.external_id, row.first_seen_at)
        }
      }
    }

    const sourceRecords = ingestedJobs
      .map((entry) => {
        const externalId = entry.job.identifier.externalId
        if (!externalId) return undefined
        const jobId = updatedJobMap.get(externalId)
        if (!jobId) return undefined
        const firstSeen = existingSourceRecords.get(externalId) ?? startIso
        return buildJobSourceRecord(entry, provider, jobId, firstSeen, timestampIso)
      })
      .filter((record): record is Record<string, unknown> => Boolean(record))

    if (sourceRecords.length) {
      const { error } = await this.client
        .from('job_source_records' as any)
        .upsert(sourceRecords, { onConflict: 'provider,external_id' })

      if (error) {
        throw new Error(`Failed to upsert job source records: ${error.message}`)
      }
    }

    const { data: closedJobs, error: closeError } = await this.client
      .from('jobs' as any)
      .update({
        status: 'closed',
        last_seen_at: timestampIso,
        updated_at: timestampIso,
      })
      .eq('source_provider', provider)
      .lt('last_seen_at', startIso)
      .neq('status', 'closed')
      .select('id')

    if (closeError) {
      throw new Error(`Failed to close stale jobs: ${closeError.message}`)
    }

    const closed = closedJobs?.length ?? 0
    const updated = jobPayloads.length - created

    return {
      created,
      updated,
      closed,
    }
  }

  async completeRun(params: CompleteJobIngestRunParams): Promise<void> {
    const finishedAtIso = toIso(params.finishedAt)
    const { error } = await this.client
      .from('job_ingest_runs' as any)
      .update({
        status: 'succeeded',
        total_jobs: params.summary.processed,
        created_jobs: params.summary.created,
        updated_jobs: params.summary.updated,
        deleted_jobs: params.summary.closed,
        finished_at: finishedAtIso,
        updated_at: finishedAtIso,
        error_payload: null,
      })
      .eq('id', params.runId)

    if (error) {
      throw new Error(`Failed to complete job ingest run: ${error.message}`)
    }
  }

  async failRun(params: FailJobIngestRunParams): Promise<void> {
    const finishedAtIso = toIso(params.finishedAt)
    const { error } = await this.client
      .from('job_ingest_runs' as any)
      .update({
        status: 'failed',
        finished_at: finishedAtIso,
        updated_at: finishedAtIso,
        error_payload: serializeError(params.error),
      })
      .eq('id', params.runId)

    if (error) {
      throw new Error(`Failed to record failed job ingest run: ${error.message}`)
    }
  }
}
