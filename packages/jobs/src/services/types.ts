import type { AdapterTelemetry } from '../adapters/base'
import type { NormalizedJob } from '../domain/job'
import type { NormalizedOrganization } from '../domain/organization'
import type { AdapterFetchParams } from '../utils'

export interface IngestedJob {
  job: NormalizedJob
  fingerprint: string
}

export interface JobIngestionSummary {
  fetched: number
  processed: number
  deduplicated: number
  created: number
  updated: number
  closed: number
}

export interface JobIngestRunRecord {
  id: string
  startedAt: Date
}

export interface StartJobIngestRunParams {
  adapter: string
  provider?: string
  parameters?: Record<string, unknown>
  startedAt: Date
}

export interface PersistJobIngestionParams {
  runId: string
  provider: string
  jobs: IngestedJob[]
  organizations: NormalizedOrganization[]
  startedAt: Date
}

export interface PersistJobIngestionResult {
  created: number
  updated: number
  closed: number
}

export interface CompleteJobIngestRunParams {
  runId: string
  telemetry: AdapterTelemetry
  summary: JobIngestionSummary
  finishedAt: Date
}

export interface FailJobIngestRunParams {
  runId: string
  error: unknown
  finishedAt: Date
}

export interface JobIngestionRepository {
  startRun(params: StartJobIngestRunParams): Promise<JobIngestRunRecord>
  persistIngestion(params: PersistJobIngestionParams): Promise<PersistJobIngestionResult>
  completeRun(params: CompleteJobIngestRunParams): Promise<void>
  failRun(params: FailJobIngestRunParams): Promise<void>
}

export interface JobIngestionRunnerOptions {
  adapter: import('../adapters/base').JobSourceAdapter
  repository: JobIngestionRepository
  fetchParams?: AdapterFetchParams
  now?: () => Date
}

export interface JobIngestionResult {
  runId: string
  jobs: NormalizedJob[]
  organizations: NormalizedOrganization[]
  telemetry: AdapterTelemetry
  summary: JobIngestionSummary
}
