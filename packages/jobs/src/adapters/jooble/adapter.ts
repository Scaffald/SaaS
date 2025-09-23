import { JoobleClient, type JoobleJob } from './client'
import {
  JobSourceAdapter,
  type AdapterPullResult,
  type HydrateCompanyParams,
  type HydrateCompanyResult,
} from '../base'
import type { AdapterFetchParams } from '../../utils'
import {
  NormalizedJobSchema,
  type NormalizedJob,
} from '../../domain/job'
import {
  NormalizedOrganizationSchema,
  type NormalizedOrganization,
} from '../../domain/organization'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const SOURCE_KEY = 'jooble'
const SOURCE_NAME = 'Jooble'

interface JoobleAdapterMetadata {
  keywords?: string[] | string
  location?: string
  radius?: number
  page?: number | string
  pageSize?: number | string
}

interface JoobleAdapterConfig {
  keywords?: string[]
  location?: string
  radius?: number
  page: number
  pageSize: number
}

function parseKeywords(raw?: string | string[]): string[] | undefined {
  if (!raw) return undefined
  if (Array.isArray(raw)) {
    return raw.map((value) => value.trim()).filter(Boolean)
  }

  return raw
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function parseNumber(raw?: number | string | null): number | undefined {
  if (raw === null || raw === undefined) return undefined
  const value = typeof raw === 'number' ? raw : Number.parseInt(raw, 10)
  return Number.isNaN(value) ? undefined : value
}

function parseDate(raw?: string): Date | undefined {
  if (!raw) return undefined
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function parseLocation(raw?: string) {
  if (!raw) return undefined
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)

  return {
    raw,
    city: parts[0],
    region: parts.length > 1 ? parts[1] : undefined,
    country: parts.length > 2 ? parts.slice(2).join(', ') : undefined,
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export class JoobleAdapter extends JobSourceAdapter {
  readonly name = SOURCE_NAME
  readonly source = SOURCE_KEY

  private readonly client: JoobleClient

  constructor(client: JoobleClient = new JoobleClient()) {
    super(SOURCE_KEY)
    this.client = client
  }

  private getDefaultConfig(env: NodeJS.ProcessEnv = process.env): JoobleAdapterConfig {
    return {
      keywords: parseKeywords(env.JOOBLE_SEARCH_KEYWORDS),
      location: env.JOOBLE_SEARCH_LOCATION ?? undefined,
      radius: parseNumber(env.JOOBLE_SEARCH_RADIUS),
      page: DEFAULT_PAGE,
      pageSize: parseNumber(env.JOOBLE_SEARCH_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
    }
  }

  private resolveConfig(params: AdapterFetchParams): JoobleAdapterConfig {
    const defaults = this.getDefaultConfig()
    const metadata = (params.metadata ?? {}) as JoobleAdapterMetadata

    const metadataKeywords = parseKeywords(metadata.keywords)
    const keywords =
      metadataKeywords ??
      parseKeywords(params.filters?.search) ??
      defaults.keywords

    const metadataLocation = metadata.location ?? undefined
    const filtersLocation = params.filters?.locations?.[0]
    const location =
      metadataLocation ??
      filtersLocation?.formatted ??
      filtersLocation?.raw ??
      filtersLocation?.city ??
      defaults.location

    const radius = parseNumber(metadata.radius) ?? defaults.radius

    const cursorPage = parseNumber(params.pagination?.cursor ?? undefined)
    const paginationPage = params.pagination?.page
    const metadataPage = parseNumber(metadata.page)
    const page = metadataPage ?? paginationPage ?? cursorPage ?? defaults.page

    const metadataPageSize = parseNumber(metadata.pageSize)
    const paginationPageSize = params.pagination?.pageSize
    const paginationLimit = params.pagination?.limit
    const pageSize =
      metadataPageSize ??
      paginationPageSize ??
      paginationLimit ??
      defaults.pageSize

    return {
      keywords,
      location,
      radius,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1),
    }
  }

  private mapJob(job: JoobleJob): { job: NormalizedJob; organization: NormalizedOrganization } | null {
    if (!job.id || !job.title || !job.link) {
      return null
    }

    const organizationName = job.company?.trim() || 'Unknown organization'
    const organizationSlug = slugify(organizationName) || `${SOURCE_KEY}-${job.id}`

    const organization = NormalizedOrganizationSchema.parse({
      id: organizationSlug,
      identifier: {
        externalId: organizationSlug,
        source: SOURCE_KEY,
        slug: organizationSlug,
      },
      name: organizationName,
    })

    const location = parseLocation(job.location)
    const postedAt = parseDate(job.published ?? job.updated)
    const updatedAt = parseDate(job.updated)

    const normalizedJob = NormalizedJobSchema.parse({
      id: `${SOURCE_KEY}-${job.id}`,
      identifier: {
        externalId: job.id,
        source: SOURCE_KEY,
        url: job.link,
      },
      title: job.title,
      url: job.link,
      description: job.snippet ?? job.title,
      summary: job.snippet,
      postedAt,
      updatedAt,
      locations: location ? [location] : undefined,
      primaryLocation: location,
      organization,
      metadata: {
        rawSalary: job.salary,
        rawType: job.type,
        sourceUrl: job.link,
      },
    })

    return { job: normalizedJob, organization: normalizedJob.organization }
  }

  async pullListings(params: AdapterFetchParams = {}): Promise<AdapterPullResult> {
    const config = this.resolveConfig(params)

    const payload = {
      keywords: config.keywords?.join(' '),
      location: config.location,
      radius: config.radius,
      page: config.page,
      size: config.pageSize,
    }

    const response = await this.client.search(payload, { signal: params.signal })

    const organizations = new Map<string, NormalizedOrganization>()
    const jobs: NormalizedJob[] = []

    for (const entry of response.data.jobs) {
      const normalized = this.mapJob(entry)
      if (!normalized) continue

      jobs.push(normalized.job)
      organizations.set(normalized.organization.id ?? normalized.organization.name, normalized.organization)
    }

    const totalCount = response.data.totalCount ?? jobs.length
    const totalPages = config.pageSize > 0 ? Math.ceil(totalCount / config.pageSize) : 0
    const nextCursor = config.page < totalPages ? String(config.page + 1) : undefined

    return {
      jobs,
      organizations: Array.from(organizations.values()),
      nextCursor,
      telemetry: this.createTelemetry({
        requestCount: 1,
        itemsReceived: jobs.length,
        durationMs: response.durationMs,
        metadata: {
          config,
          totalCount,
          status: response.status,
        },
      }),
    }
  }

  async hydrateCompany({ organization }: HydrateCompanyParams): Promise<HydrateCompanyResult> {
    return {
      organization,
      telemetry: this.createTelemetry({
        requestCount: 0,
        itemsReceived: 1,
      }),
    }
  }
}

export function createJoobleAdapter(client?: JoobleClient) {
  return new JoobleAdapter(client)
}
