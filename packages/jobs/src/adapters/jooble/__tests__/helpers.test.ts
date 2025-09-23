import { describe, expect, it } from 'vitest'

import type { Location } from '../../../domain/common'
import type { AdapterFetchParams } from '../../../utils'
import type { JoobleJob } from '../client'
import {
  buildConfig,
  parseDate,
  parseKeywords,
  parseLocation,
  parseNumber,
  parseSalary,
  slugify,
  toNormalized,
} from '../adapter'

describe('parseKeywords', () => {
  it('returns undefined for missing input', () => {
    expect(parseKeywords()).toBeUndefined()
  })

  it('trims and filters values from arrays', () => {
    expect(parseKeywords(['  TypeScript ', '', 'React'])).toEqual(['TypeScript', 'React'])
  })

  it('splits comma and whitespace separated strings', () => {
    expect(parseKeywords('full stack,  engineer  remote')).toEqual([
      'full',
      'stack',
      'engineer',
      'remote',
    ])
  })
})

describe('parseNumber', () => {
  it('parses numeric strings and ignores invalid inputs', () => {
    expect(parseNumber(42)).toBe(42)
    expect(parseNumber('7')).toBe(7)
    expect(parseNumber('invalid')).toBeUndefined()
    expect(parseNumber(null)).toBeUndefined()
  })
})

describe('parseDate', () => {
  it('returns undefined for invalid dates and parses valid inputs', () => {
    expect(parseDate()).toBeUndefined()
    expect(parseDate('not-a-date')).toBeUndefined()
    expect(parseDate('2024-03-01')?.toISOString()).toBe('2024-03-01T00:00:00.000Z')
  })
})

describe('parseLocation', () => {
  it('parses city, region, and country segments', () => {
    expect(parseLocation()).toBeUndefined()
    expect(parseLocation('Seattle')).toEqual({
      raw: 'Seattle',
      city: 'Seattle',
      region: undefined,
      country: undefined,
    })

    expect(parseLocation('Remote City, CA, United States, Earth')).toEqual({
      raw: 'Remote City, CA, United States, Earth',
      city: 'Remote City',
      region: 'CA',
      country: 'United States, Earth',
    })
  })
})

describe('parseSalary', () => {
  it('trims whitespace and ignores empty values', () => {
    expect(parseSalary()).toBeUndefined()
    expect(parseSalary('   ')).toBeUndefined()
    expect(parseSalary(' $120k ')).toBe('$120k')
  })
})

describe('slugify', () => {
  it('converts arbitrary strings into URL-safe slugs', () => {
    expect(slugify('Acme Corp!!')).toBe('acme-corp')
    expect(slugify('***')).toBe('')
  })
})

describe('toNormalized', () => {
  const baseJob: JoobleJob = {
    id: '123',
    title: 'Senior Engineer',
    link: 'https://example.com/job',
    company: 'Acme Corp',
    location: 'Remote, OR, USA',
    salary: '  $100k ',
    snippet: 'Build great things.',
    type: 'Full-time',
    published: '2024-02-01',
    updated: '2024-02-05',
  }

  it('normalizes valid jobs and trims nested values', () => {
    const normalized = toNormalized(baseJob)
    expect(normalized).not.toBeNull()
    expect(normalized?.job.id).toBe('jooble-123')
    expect(normalized?.job.organization.name).toBe('Acme Corp')
    expect(normalized?.job.organization.identifier?.slug).toBe('acme-corp')
    expect(normalized?.job.metadata?.rawSalary).toBe('$100k')
    expect(normalized?.job.primaryLocation?.city).toBe('Remote')
    expect(normalized?.job.primaryLocation?.region).toBe('OR')
    expect(normalized?.job.primaryLocation?.country).toBe('USA')
    expect(normalized?.job.postedAt?.toISOString()).toBe('2024-02-01T00:00:00.000Z')
  })

  it('returns null for incomplete jobs and falls back to generated slugs', () => {
    expect(
      toNormalized({ id: '', title: 'Incomplete', link: 'https://example.com' } as JoobleJob)
    ).toBeNull()

    const slugFallbackJob: JoobleJob = {
      id: 'abc',
      title: 'Engineer',
      link: 'https://example.com/abc',
      company: '@@@',
      updated: '2024-01-10',
      salary: ' ',
    }

    const normalized = toNormalized(slugFallbackJob)
    expect(normalized).not.toBeNull()
    expect(normalized?.organization.identifier?.slug).toBe('jooble-abc')
    expect(normalized?.job.metadata?.rawSalary).toBeUndefined()
    expect(normalized?.job.primaryLocation).toBeUndefined()
  })
})

describe('buildConfig', () => {
  it('honors metadata overrides and coerces numeric values', () => {
    const env = {
      JOOBLE_SEARCH_KEYWORDS: 'default dev',
      JOOBLE_SEARCH_LOCATION: 'Env City',
      JOOBLE_SEARCH_RADIUS: '15',
      JOOBLE_SEARCH_PAGE_SIZE: '25',
    } as NodeJS.ProcessEnv

    const filterLocation: Location = { formatted: 'Filter City, ST' }
    const params: AdapterFetchParams = {
      metadata: {
        keywords: [' TypeScript ', 'React'],
        location: 'Metadata City',
        radius: '35',
        page: '5',
        pageSize: '100',
      } as unknown as Record<string, unknown>,
      filters: {
        search: 'ignored search',
        locations: [filterLocation],
      },
      pagination: { cursor: '3', page: 2, pageSize: 15, limit: 200 },
    }

    const config = buildConfig(params, env)
    expect(config).toEqual({
      keywords: ['TypeScript', 'React'],
      location: 'Metadata City',
      radius: 35,
      page: 5,
      pageSize: 100,
    })
  })

  it('falls back to filters, pagination defaults, and environment values', () => {
    const env = {
      JOOBLE_SEARCH_KEYWORDS: 'backend go',
      JOOBLE_SEARCH_LOCATION: 'Env Default',
      JOOBLE_SEARCH_RADIUS: '10',
      JOOBLE_SEARCH_PAGE_SIZE: '20',
    } as NodeJS.ProcessEnv

    const filterLocation: Location = { city: 'Filter City' }
    const params: AdapterFetchParams = {
      filters: {
        search: '  go   rust  ',
        locations: [filterLocation],
      },
      pagination: { cursor: '7', limit: 15 },
      metadata: {
        page: '-2',
        radius: 'invalid',
      } as unknown as Record<string, unknown>,
    }

    const config = buildConfig(params, env)
    expect(config).toEqual({
      keywords: ['go', 'rust'],
      location: 'Filter City',
      radius: 10,
      page: 1,
      pageSize: 15,
    })
  })
})
