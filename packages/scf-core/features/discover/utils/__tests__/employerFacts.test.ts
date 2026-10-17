import { describe, expect, it } from 'vitest'
import {
  employerDescriptor,
  employerRowFacts,
  formatEmployerPlace,
  formatOpenRoles,
  sinceYear,
} from '../employerFacts'

// The seeded shape of core.organizations.address.
const DAVISON = {
  city: 'Davison',
  state: 'MI',
  postal: '48423',
  street: '3390 N State Road, Suite C',
  country: 'USA',
}

describe('formatEmployerPlace', () => {
  it('gives city and state, never the street (#1185)', () => {
    expect(formatEmployerPlace(DAVISON)).toBe('Davison, MI')
  })

  it('falls back to whichever of city or state is known', () => {
    expect(formatEmployerPlace({ city: 'Troy' })).toBe('Troy')
    expect(formatEmployerPlace({ state: 'MI', street: '1 Main St' })).toBe('MI')
  })

  it('is null for a missing or street-only address', () => {
    expect(formatEmployerPlace(null)).toBeNull()
    expect(formatEmployerPlace(undefined)).toBeNull()
    expect(formatEmployerPlace({ street: '1 Main St', zipCode: '48226' })).toBeNull()
    expect(formatEmployerPlace({ city: '  ', state: '' })).toBeNull()
  })
})

describe('sinceYear', () => {
  it('reads the year from an ISO timestamp', () => {
    expect(sinceYear('2026-10-05T12:10:30.321195+00:00')).toBe(2026)
  })

  it('is null for missing or unparseable input', () => {
    expect(sinceYear(null)).toBeNull()
    expect(sinceYear('not a date')).toBeNull()
  })
})

describe('formatOpenRoles', () => {
  it('pluralises', () => {
    expect(formatOpenRoles(0)).toBe('No open roles')
    expect(formatOpenRoles(1)).toBe('1 open role')
    expect(formatOpenRoles(4)).toBe('4 open roles')
  })

  it('is null when the count is unknown', () => {
    expect(formatOpenRoles(undefined)).toBeNull()
    expect(formatOpenRoles(null)).toBeNull()
  })
})

describe('employerRowFacts', () => {
  it('joins industry and place', () => {
    expect(employerRowFacts({ industryName: 'Construction', address: DAVISON })).toBe(
      'Construction · Davison, MI'
    )
  })

  it('drops missing facts without a stray separator', () => {
    expect(employerRowFacts({ industryName: null, address: DAVISON })).toBe('Davison, MI')
    expect(employerRowFacts({ industryName: 'Construction', address: null })).toBe('Construction')
    expect(employerRowFacts({})).toBe('')
  })
})

describe('employerDescriptor', () => {
  it('reads industry · place · since <year> (#1186)', () => {
    expect(
      employerDescriptor({
        industryName: 'Construction',
        address: DAVISON,
        createdAt: '2026-10-05T12:10:30Z',
      })
    ).toBe('Construction · Davison, MI · on Scaffald since 2026')
  })

  it('still has a line when industry and address are missing', () => {
    expect(employerDescriptor({ createdAt: '2024-03-14T00:00:00Z' })).toBe(
      'on Scaffald since 2024'
    )
  })

  it('never prints a numeric m/d/yyyy date', () => {
    const line = employerDescriptor({ address: DAVISON, createdAt: '2026-10-05T00:00:00Z' })
    expect(line).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
  })
})
