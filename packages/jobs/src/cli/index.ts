import { randomUUID } from 'node:crypto'

import type { JobSourceAdapter } from '../adapters/base'
import { createJoobleAdapter } from '../adapters/jooble/adapter'
import type { AdapterFetchParams, AdapterFilter, PaginationParams } from '../utils'
import {
  runJobIngestion,
  type JobIngestionRepository,
  type JobIngestionResult,
  type PersistJobIngestionParams,
  type StartJobIngestRunParams,
} from '../services'

type AdapterFactory = () => JobSourceAdapter

const ADAPTER_FACTORIES: Record<string, AdapterFactory> = {
  jooble: () => createJoobleAdapter(),
}

const TRUE_LITERALS = new Set(['true', '1', 'yes', 'y', 'on'])
const FALSE_LITERALS = new Set(['false', '0', 'no', 'n', 'off'])

interface ParsedCliArguments {
  adapterKey: string
  fetchParams: AdapterFetchParams
}

const createRunIdentifier = (): string => {
  try {
    return randomUUID()
  } catch (_error) {
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }
}

const createRepository = (): JobIngestionRepository => ({
  async startRun(params: StartJobIngestRunParams) {
    return { id: createRunIdentifier(), startedAt: params.startedAt }
  },

  async persistIngestion(params: PersistJobIngestionParams) {
    return { created: params.jobs.length, updated: 0, closed: 0 }
  },

  async completeRun() {
    // Persistence is not yet wired for the CLI entrypoint.
  },

  async failRun() {
    // Persistence is not yet wired for the CLI entrypoint.
  },
})

const parseInteger = (value?: string): number | undefined => {
  if (value === undefined) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

const parseBoolean = (value?: string): boolean => {
  if (value === undefined) return true
  const normalized = value.trim().toLowerCase()
  if (FALSE_LITERALS.has(normalized)) return false
  if (TRUE_LITERALS.has(normalized)) return true
  return normalized.length > 0
}

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const normalizeAdapterKey = (value?: string): string => {
  const normalized = value?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : 'jooble'
}

const assignLocationFilter = (
  filters: AdapterFilter,
  location?: string
): AdapterFilter => {
  if (!location) return filters
  const trimmed = location.trim()
  if (!trimmed) return filters

  return {
    ...filters,
    locations: [
      {
        raw: trimmed,
        formatted: trimmed,
      },
    ],
  }
}

const parseArguments = (argv: readonly string[]): ParsedCliArguments => {
  let adapterKey = 'jooble'
  const fetchParams: AdapterFetchParams = {}
  const pagination: PaginationParams = {}
  let hasPagination = false
  let filters: AdapterFilter = {}
  let hasFilters = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--') {
      const next = argv[index + 1]
      if (next) {
        adapterKey = normalizeAdapterKey(next)
      }
      break
    }

    if (!token.startsWith('-')) {
      adapterKey = normalizeAdapterKey(token)
      continue
    }

    if (!token.startsWith('--')) {
      continue
    }

    const [rawName, inlineValue] = token.slice(2).split('=', 2)
    const flag = rawName.toLowerCase()
    let value = inlineValue

    if (value === undefined) {
      const maybeValue = argv[index + 1]
      if (maybeValue !== undefined && !maybeValue.startsWith('-')) {
        value = maybeValue
        index += 1
      }
    }

    value = value?.trim()
    if (value === '') {
      value = undefined
    }

    switch (flag) {
      case 'adapter':
      case 'source':
        adapterKey = normalizeAdapterKey(value)
        break
      case 'cursor':
        if (value !== undefined) {
          pagination.cursor = value
          hasPagination = true
        }
        break
      case 'page': {
        const parsed = parseInteger(value)
        if (parsed !== undefined) {
          pagination.page = parsed
          hasPagination = true
        }
        break
      }
      case 'page-size':
      case 'page_size':
      case 'pagesize': {
        const parsed = parseInteger(value)
        if (parsed !== undefined) {
          pagination.pageSize = parsed
          hasPagination = true
        }
        break
      }
      case 'limit': {
        const parsed = parseInteger(value)
        if (parsed !== undefined) {
          pagination.limit = parsed
          hasPagination = true
        }
        break
      }
      case 'search':
        if (value !== undefined) {
          filters = { ...filters, search: value }
          hasFilters = true
        }
        break
      case 'location':
      case 'locations':
        filters = assignLocationFilter(filters, value)
        hasFilters = true
        break
      case 'remote-only':
      case 'remote_only':
      case 'remoteonly':
        filters = { ...filters, remoteOnly: parseBoolean(value) }
        hasFilters = true
        break
      case 'include-closed':
      case 'include_closed':
      case 'includeclosed':
        filters = { ...filters, includeClosed: parseBoolean(value) }
        hasFilters = true
        break
      case 'tag':
      case 'tags':
        if (value) {
          const existing = filters.tags ?? []
          filters = { ...filters, tags: [...existing, value] }
          hasFilters = true
        }
        break
      case 'since': {
        const parsed = parseDate(value)
        if (parsed) {
          fetchParams.since = parsed
        }
        break
      }
      case 'until': {
        const parsed = parseDate(value)
        if (parsed) {
          fetchParams.until = parsed
        }
        break
      }
      default:
        break
    }
  }

  if (hasPagination) {
    fetchParams.pagination = pagination
  }

  if (hasFilters) {
    fetchParams.filters = filters
  }

  return { adapterKey, fetchParams }
}

const resolveAdapter = (key: string): JobSourceAdapter => {
  const normalized = normalizeAdapterKey(key)
  const factory = ADAPTER_FACTORIES[normalized]
  if (!factory) {
    throw new Error(`Unknown job source adapter: ${key}`)
  }
  return factory()
}

const logResult = (result: JobIngestionResult) => {
  const { runId, summary, telemetry } = result
  console.info('Job ingestion run completed.', {
    runId,
    jobsProcessed: summary.processed,
    summary,
    telemetry: {
      source: telemetry.source,
      requestCount: telemetry.requestCount,
      itemsReceived: telemetry.itemsReceived,
      durationMs: telemetry.durationMs,
      warnings: telemetry.warnings ?? [],
      rateLimit: telemetry.rateLimit,
    },
  })
}

export async function syncJobSources(argv: string[] = process.argv.slice(2)) {
  const { adapterKey, fetchParams } = parseArguments(argv)
  const adapter = resolveAdapter(adapterKey)
  const repository = createRepository()

  const result = await runJobIngestion({ adapter, repository, fetchParams })
  logResult(result)
  return result
}
