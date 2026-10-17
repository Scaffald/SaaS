import { describe, expect, it } from 'vitest'

import { buildTrustTags, identityFacts } from '../identity'

const now = new Date('2026-10-17T12:00:00Z')

describe('buildTrustTags', () => {
  it('draws nothing when nothing is verified', () => {
    expect(
      buildTrustTags({
        backgroundChecks: [{ id: 'b1', status: 'in_progress' }],
        certifications: [{ id: 'c1', name: 'OSHA 30', verification_status: 'unverified' }],
        skills: [{ verified: false }],
        now,
      })
    ).toEqual([])
    expect(buildTrustTags({ now })).toEqual([])
  })

  it('shows a clear check and a verified certification as filled tags, skills as outlined', () => {
    const tags = buildTrustTags({
      backgroundChecks: [
        { id: 'b0', status: 'completed_consider' },
        { id: 'b1', status: 'completed_clear', expires_at: '2027-01-01T00:00:00Z' },
      ],
      certifications: [
        { id: 'c1', name: 'OSHA 30', verification_status: 'verified' },
        { id: 'c2', name: 'First Aid', verification_status: 'pending' },
      ],
      skills: [{ verified: true }, { verified: true }, { verified: false }],
      now,
    })
    expect(tags).toEqual([
      { key: 'bg-b1', label: '✓ Background check clear', tone: 'accent' },
      { key: 'cert-c1', label: '✓ OSHA 30 verified', tone: 'accent' },
      { key: 'skills-verified', label: '◈ 2 verified skills', tone: 'outline' },
    ])
  })

  it('leaves out lapsed proof', () => {
    const tags = buildTrustTags({
      backgroundChecks: [{ id: 'b1', status: 'completed_clear', expires_at: '2026-01-01' }],
      certifications: [
        { id: 'c1', name: 'OSHA 30', verification_status: 'verified', expiration_date: '2026-10-01' },
        {
          id: 'c2',
          name: 'NCCER Core',
          verification_status: 'verified',
          expiration_date: '2020-01-01',
          does_not_expire: true,
        },
      ],
      now,
    })
    expect(tags.map((tag) => tag.key)).toEqual(['cert-c2'])
  })

  it('says skill, singular, for one', () => {
    expect(buildTrustTags({ skills: [{ verified: true }], now })[0]?.label).toBe(
      '◈ 1 verified skill'
    )
  })
})

describe('identityFacts', () => {
  it('reads trade, location and years, skipping what is missing', () => {
    expect(
      identityFacts({
        industries: { name: 'Electrical' },
        privateData: { location: 'Denver, CO' },
        calculatedYearsOfExperience: 6,
      })
    ).toEqual(['Electrical', 'Denver, CO', '6 years in the trade'])
    expect(identityFacts({ years_of_experience: 1 })).toEqual(['1 year in the trade'])
    expect(identityFacts({ calculatedYearsOfExperience: 2.345 })).toEqual(['2.3 years in the trade'])
    expect(identityFacts({ calculatedYearsOfExperience: 0 })).toEqual([])
  })
})
