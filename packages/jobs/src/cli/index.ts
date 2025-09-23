import { createJoobleAdapter } from '../adapters'
import { JoobleClient } from '../adapters/jooble/client'
import type { JobSourceAdapter } from '../adapters/base'
import { runJobIngestion } from '../services'
import type {
  JobIngestionRepository,
  JobIngestionResult,
  JobIngestionRunnerOptions,
} from '../services'
import type { AdapterFetchParams } from '../utils'
import type { EmploymentType, ExperienceLevel, WorkplaceType } from '../domain/job'

type AdapterFactory = (env: NodeJS.ProcessEnv) => JobSourceAdapter

interface ParsedCliArguments {
  adapterKey: string
  fetchParams: AdapterFetchParams
}

interface SyncJobSourcesOptions {
  argv?: string[]
  env?: NodeJS.ProcessEnv
  ingest?: (options: JobIngestionRunnerOptions) => Promise<JobIngestionResult>
  adapters?: Record<string, AdapterFactory>
  repository?: JobIngestionRepository
  logger?: Pick<typeof console, 'info'>
}

const DEFAULT_ADAPTER_FACTORIES: Record<string, AdapterFactory> = {
  jooble: (env) => createJoobleAdapter(new JoobleClient({ apiKey: env.JOOBLE_API_KEY })),
}

class InMemoryJobIngestionRepository implements JobIngestionRepository {
  private sequence = 0

  async startRun(params: Parameters<JobIngestionRepository['startRun']>[0]) {
    this.sequence += 1
    return { id: `local-run-${this.sequence}`, startedAt: params.startedAt }
  }

  async persistIngestion(params: Parameters<JobIngestionRepository['persistIngestion']>[0]) {
    return {
      created: params.jobs.length,
      updated: 0,
      closed: 0,
    }
  }

  async completeRun(): Promise<void> {
    return undefined
  }

  async failRun(): Promise<void> {
    return undefined
  }
}

const createDefaultRepository = (): JobIngestionRepository => new InMemoryJobIngestionRepository()

const normalizeKey = (key: string) => key.trim().toLowerCase()

const parseArgv = (argv: string[]): Map<string, string[]> => {
  const entries = new Map<string, string[]>()

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) continue

    const raw = token.slice(2)
    if (!raw) continue

    const equalsIndex = raw.indexOf('=')
    let key = raw
    let value: string | undefined

    if (equalsIndex >= 0) {
      key = raw.slice(0, equalsIndex)
      value = raw.slice(equalsIndex + 1)
    } else {
      const next = argv[index + 1]
      if (next && !next.startsWith('--')) {
        value = next
        index += 1
      }
    }

    const normalizedKey = normalizeKey(key)
    const normalizedValue = value ?? 'true'
    const existing = entries.get(normalizedKey)
    if (existing) {
      existing.push(normalizedValue)
    } else {
      entries.set(normalizedKey, [normalizedValue])
    }
  }

  return entries
}

const getLastValue = (map: Map<string, string[]>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const values = map.get(normalizeKey(key))
    if (values?.length) {
      const candidate = values[values.length - 1]?.trim()
      if (candidate) return candidate
    }
  }
  return undefined
}

const getAllValues = (map: Map<string, string[]>, keys: string[]): string[] => {
  const result: string[] = []
  for (const key of keys) {
    const values = map.get(normalizeKey(key))
    if (values?.length) {
      for (const value of values) {
        if (value?.trim()) {
          result.push(value.trim())
        }
      }
    }
  }
  return result
}

const parseInteger = (value: string, label: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for --${label}: ${value}`)
  }
  return parsed
}

const parseBoolean = (value: string, label: string): boolean => {
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  throw new Error(`Invalid boolean for --${label}: ${value}`)
}

const parseDate = (value: string, label: string): Date => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for --${label}: ${value}`)
  }
  return parsed
}

const parseList = (values: string[]): string[] | undefined => {
  const entries = values
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
  return entries.length ? entries : undefined
}

const parseMetadata = (
  map: Map<string, string[]>,
  prefix: string
): Record<string, unknown> | undefined => {
  const metadata: Record<string, unknown> = {}
  for (const [key, values] of map.entries()) {
    if (!key.startsWith(prefix)) continue
    const path = key.slice(prefix.length)
    if (!path) continue
    const value = values[values.length - 1]
    if (value === undefined) continue
    const normalized = value.trim()
    if (!normalized) continue
    const lowered = normalized.toLowerCase()
    if (['true', 'false'].includes(lowered)) {
      metadata[path] = lowered === 'true'
      continue
    }
    const asNumber = Number(normalized)
    if (!Number.isNaN(asNumber) && normalized === asNumber.toString()) {
      metadata[path] = asNumber
      continue
    }
    if (
      (normalized.startsWith('{') && normalized.endsWith('}')) ||
      (normalized.startsWith('[') && normalized.endsWith(']'))
    ) {
      try {
        metadata[path] = JSON.parse(normalized)
        continue
      } catch {
        // fall through to string assignment below
      }
    }
    metadata[path] = normalized
  }

  return Object.keys(metadata).length ? metadata : undefined
}

const parseCliArguments = (argv: string[]): ParsedCliArguments => {
  const args = parseArgv(argv)

  const adapterKey = getLastValue(args, ['adapter', 'adapter-key'])?.toLowerCase() ?? 'jooble'

  const fetchParams: AdapterFetchParams = {}

  const paginationCursor = getLastValue(args, ['pagination.cursor', 'cursor'])
  const paginationPageValue = getLastValue(args, ['pagination.page', 'page'])
  const paginationPageSizeValue = getLastValue(args, [
    'pagination.page-size',
    'pagination.pagesize',
    'page-size',
    'pagesize',
  ])
  const paginationLimitValue = getLastValue(args, ['pagination.limit', 'limit'])

  const pagination: AdapterFetchParams['pagination'] = {}
  if (paginationCursor) {
    pagination.cursor = paginationCursor
  }
  if (paginationPageValue) {
    pagination.page = parseInteger(paginationPageValue, 'page')
  }
  if (paginationPageSizeValue) {
    pagination.pageSize = parseInteger(paginationPageSizeValue, 'page-size')
  }
  if (paginationLimitValue) {
    pagination.limit = parseInteger(paginationLimitValue, 'limit')
  }
  if (Object.keys(pagination).length) {
    fetchParams.pagination = pagination
  }

  const sinceValue = getLastValue(args, ['since'])
  if (sinceValue) {
    fetchParams.since = parseDate(sinceValue, 'since')
  }

  const untilValue = getLastValue(args, ['until'])
  if (untilValue) {
    fetchParams.until = parseDate(untilValue, 'until')
  }

  const metadata = parseMetadata(args, 'metadata.')
  if (metadata) {
    fetchParams.metadata = metadata
  }

  const filters: NonNullable<AdapterFetchParams['filters']> = {}

  const search = getLastValue(args, ['filters.search', 'search'])
  if (search) {
    filters.search = search
  }

  const locationValues = getAllValues(args, [
    'filters.location',
    'filters.locations',
    'location',
    'locations',
  ])
  if (locationValues.length) {
    filters.locations = locationValues.map((value) => ({ raw: value, formatted: value }))
  }

  const employmentTypes = parseList(
    getAllValues(args, [
      'filters.employment-types',
      'filters.employmenttypes',
      'employment-types',
      'employmenttypes',
    ])
  )
  if (employmentTypes) {
    filters.employmentTypes = employmentTypes as EmploymentType[]
  }

  const experienceLevels = parseList(
    getAllValues(args, [
      'filters.experience-levels',
      'filters.experiencelevels',
      'experience-levels',
      'experiencelevels',
    ])
  )
  if (experienceLevels) {
    filters.experienceLevels = experienceLevels as ExperienceLevel[]
  }

  const workplaceTypes = parseList(
    getAllValues(args, [
      'filters.workplace-types',
      'filters.workplacetypes',
      'workplace-types',
      'workplacetypes',
    ])
  )
  if (workplaceTypes) {
    filters.workplaceTypes = workplaceTypes as WorkplaceType[]
  }

  const remoteOnlyValue = getLastValue(args, [
    'filters.remote-only',
    'filters.remoteonly',
    'remote-only',
    'remoteonly',
  ])
  if (remoteOnlyValue) {
    filters.remoteOnly = parseBoolean(remoteOnlyValue, 'remote-only')
  }

  const includeClosedValue = getLastValue(args, [
    'filters.include-closed',
    'filters.includeclosed',
    'include-closed',
    'includeclosed',
  ])
  if (includeClosedValue) {
    filters.includeClosed = parseBoolean(includeClosedValue, 'include-closed')
  }

  const tagValues = parseList(getAllValues(args, ['filters.tags', 'tags']))
  if (tagValues) {
    filters.tags = tagValues
  }

  const filterMetadata = parseMetadata(args, 'filters.metadata.')
  if (filterMetadata) {
    filters.metadata = filterMetadata
  }

  if (Object.keys(filters).length) {
    fetchParams.filters = filters
  }

  return { adapterKey, fetchParams }
}

export async function syncJobSources(options: SyncJobSourcesOptions = {}) {
  const {
    argv = process.argv.slice(2),
    env = process.env,
    ingest = runJobIngestion,
    adapters = DEFAULT_ADAPTER_FACTORIES,
    repository = createDefaultRepository(),
    logger = console,
  } = options

  const { adapterKey, fetchParams } = parseCliArguments(argv)
  const adapterFactory = adapters[adapterKey]
  if (!adapterFactory) {
    throw new Error(`Unsupported adapter: ${adapterKey}`)
  }

  const adapter = adapterFactory(env)
  const result = await ingest({ adapter, repository, fetchParams })

  const { summary, telemetry } = result

  logger.info(`Run ID: ${result.runId}`)
  logger.info(
    `Jobs fetched=${summary.fetched}, processed=${summary.processed}, deduplicated=${summary.deduplicated}`
  )
  logger.info(
    `Persistence: created=${summary.created}, updated=${summary.updated}, closed=${summary.closed}`
  )
  logger.info('Telemetry:', telemetry)

  return result
}

export type { SyncJobSourcesOptions }
