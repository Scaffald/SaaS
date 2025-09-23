import { JoobleClient, type JoobleJob } from './client'
import type { AdapterConfig, AdapterResult, JobSourceAdapter, AdapterRunOptions } from '../base'
import type { NormalizedJob, NormalizedLocation, NormalizedOrganization, NormalizedSalary } from '../../domain/types'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const SOURCE_NAME = 'Jooble'
const SOURCE_KEY = 'jooble'

export interface JoobleAdapterConfig extends AdapterConfig {}

function parseKeywords(raw?: string): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function parseNumber(raw?: string): number | undefined {
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseDate(raw?: string): string | undefined {
  if (!raw) return undefined
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

function parseLocation(raw?: string): NormalizedLocation | undefined {
  if (!raw) return undefined
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)

  return {
    raw,
    city: parts[0],
    state: parts.length > 1 ? parts[1] : undefined,
    country: parts.length > 2 ? parts.slice(2).join(', ') : undefined,
  }
}

function parseSalary(raw?: string): NormalizedSalary | undefined {
  if (!raw) return undefined
  return { raw }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toNormalized(job: JoobleJob): { job: NormalizedJob; organization: NormalizedOrganization } {
  const organizationName = job.company?.trim() || 'Unknown organization'
  const organizationId = slugify(organizationName) || `jooble-${job.id}`
  const postedAt = parseDate(job.published ?? job.updated)
  const updatedAt = parseDate(job.updated)

  const normalizedJob: NormalizedJob = {
    id: `${SOURCE_KEY}-${job.id}`,
    externalId: job.id,
    title: job.title,
    description: job.snippet,
    organizationId,
    source: SOURCE_KEY,
    location: parseLocation(job.location),
    salary: parseSalary(job.salary),
    postedAt,
    updatedAt,
    applyUrl: job.link,
    sourceUrl: job.link,
    metadata: {
      type: job.type,
    },
  }

  const organization: NormalizedOrganization = {
    id: organizationId,
    name: organizationName,
  }

  return { job: normalizedJob, organization }
}

function buildConfig(
  defaults: JoobleAdapterConfig,
  overrides: Partial<JoobleAdapterConfig> = {},
): JoobleAdapterConfig {
  return {
    keywords: overrides.keywords ?? defaults.keywords,
    location: overrides.location ?? defaults.location,
    radius: overrides.radius ?? defaults.radius,
    page: overrides.page ?? defaults.page ?? DEFAULT_PAGE,
    pageSize: overrides.pageSize ?? defaults.pageSize ?? DEFAULT_PAGE_SIZE,
  }
}

export class JoobleAdapter implements JobSourceAdapter<JoobleAdapterConfig> {
  readonly name = SOURCE_NAME
  readonly source = SOURCE_KEY

  private readonly client: JoobleClient

  constructor(client: JoobleClient = new JoobleClient()) {
    this.client = client
  }

  getDefaultConfig(env: NodeJS.ProcessEnv = process.env): JoobleAdapterConfig {
    return {
      keywords: parseKeywords(env.JOOBLE_SEARCH_KEYWORDS),
      location: env.JOOBLE_SEARCH_LOCATION ?? undefined,
      radius: parseNumber(env.JOOBLE_SEARCH_RADIUS),
      page: DEFAULT_PAGE,
      pageSize: parseNumber(env.JOOBLE_SEARCH_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
    }
  }

  async sync(
    overrides: Partial<JoobleAdapterConfig> = {},
    options?: AdapterRunOptions,
  ): Promise<AdapterResult<JoobleAdapterConfig>> {
    const defaults = this.getDefaultConfig()
    const config = buildConfig(defaults, overrides)

    const payload = {
      keywords: config.keywords?.join(' '),
      location: config.location,
      radius: config.radius,
      page: config.page,
      size: config.pageSize,
    }

    const response = await this.client.search(payload, { signal: options?.signal })

    const organizations = new Map<string, NormalizedOrganization>()
    const jobs: NormalizedJob[] = response.data.jobs.map((job) => {
      const normalized = toNormalized(job)
      organizations.set(normalized.organization.id, normalized.organization)
      return normalized.job
    })

    return {
      jobs,
      organizations: Array.from(organizations.values()),
      meta: {
        source: this.source,
        requestedAt: new Date().toISOString(),
        durationMs: response.durationMs,
        returnedCount: jobs.length,
        totalCount: response.data.totalCount,
        config,
      },
      rawResponse: response.data,
    }
  }
}

export function createJoobleAdapter(client?: JoobleClient) {
  return new JoobleAdapter(client)
}
