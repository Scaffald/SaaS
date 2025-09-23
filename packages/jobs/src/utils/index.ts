import { createHash } from 'node:crypto'

import type { EmploymentType, ExperienceLevel, NormalizedJob, WorkplaceType } from '../domain/job'
import type { Location } from '../domain/common'

export interface PaginationParams {
  cursor?: string
  page?: number
  pageSize?: number
  limit?: number
}

export interface AdapterFilter {
  search?: string
  locations?: Location[]
  employmentTypes?: EmploymentType[]
  experienceLevels?: ExperienceLevel[]
  workplaceTypes?: WorkplaceType[]
  remoteOnly?: boolean
  includeClosed?: boolean
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface AdapterFetchParams {
  pagination?: PaginationParams
  since?: Date
  until?: Date
  filters?: AdapterFilter
  signal?: AbortSignal
  metadata?: Record<string, unknown>
}

const normalize = (value?: string | null) => (value ? value.trim().toLowerCase() : '')

const normalizeLocation = (location?: Location | null) => {
  if (!location) {
    return ''
  }
  return [
    location.city,
    location.region,
    location.countryCode ?? location.country,
    location.timeZone,
  ]
    .map(normalize)
    .filter(Boolean)
    .join(':')
}

export const buildJobFingerprint = (job: NormalizedJob): string => {
  const hash = createHash('sha256')
  const locationValues = job.locations?.length
    ? job.locations
        .map((loc) => normalizeLocation(loc))
        .sort()
        .join('|')
    : normalizeLocation(job.primaryLocation)

  const postedDate = job.postedAt ? new Date(job.postedAt).toISOString().slice(0, 10) : ''

  const values = [
    normalize(job.identifier.externalId),
    normalize(job.identifier.source),
    normalize(job.title),
    normalize(job.organization.name),
    normalize(job.url),
    locationValues,
    postedDate,
  ]

  hash.update(values.join('|'))
  return hash.digest('hex')
}
