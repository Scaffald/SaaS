/**
 * Requirement matching on the job detail screen.
 *
 * The rule these tests pin: a requirement is `met` or `unmet` only when the
 * app can genuinely answer it from the viewer's own profile, and `unknown`
 * otherwise. A screen that guesses tells someone they cannot apply when they
 * can, which is worse than a screen that says nothing.
 */

import { describe, expect, it } from 'vitest'
import {
  buildJobRequirements,
  formatProfileGaps,
  profileGaps,
  requirementsSummary,
  rowRequirementsSummary,
  totalYearsOfExperience,
} from '../job-requirements'

describe('totalYearsOfExperience', () => {
  it('counts elapsed months, so a six-month gig is not a year', () => {
    const years = totalYearsOfExperience(
      [{ start_date: '2026-01-01', end_date: '2026-07-01' }],
      new Date('2026-09-01'),
    )
    expect(years).toBeCloseTo(0.5, 2)
  })

  it('counts a current role up to today', () => {
    const years = totalYearsOfExperience(
      [{ start_date: '2024-09-01', end_date: null, is_current: true }],
      new Date('2026-09-01'),
    )
    expect(years).toBeCloseTo(2, 2)
  })

  it('ignores entries with no start date or an end before the start', () => {
    expect(
      totalYearsOfExperience(
        [
          { start_date: null, end_date: '2026-01-01' },
          { start_date: '2026-06-01', end_date: '2026-01-01' },
        ],
        new Date('2026-09-01'),
      ),
    ).toBe(0)
  })
})

describe('buildJobRequirements', () => {
  const profile = {
    education: [{ degree_type: 'associate' }],
    experience: [{ start_date: '2020-01-01', end_date: null, is_current: true }],
    driversLicenseClasses: ['C'],
  }

  it('marks education met when the degree held outranks the one required', () => {
    const [req] = buildJobRequirements({
      job: { minimum_education_level: 'high_school' },
      profile,
    })
    expect(req.status).toBe('met')
  })

  it('marks education unmet when it does not', () => {
    const [req] = buildJobRequirements({
      job: { minimum_education_level: 'doctorate' },
      profile,
    })
    expect(req.status).toBe('unmet')
  })

  it('leaves an unrecognised education level unknown rather than unmet', () => {
    const [req] = buildJobRequirements({
      job: { minimum_education_level: 'journeyman card' },
      profile,
    })
    expect(req.status).toBe('unknown')
  })

  it('compares years of experience against the total on the profile', () => {
    const met = buildJobRequirements({ job: { minimum_years_experience: 3 }, profile })
    const unmet = buildJobRequirements({ job: { minimum_years_experience: 30 }, profile })
    expect(met[0].status).toBe('met')
    expect(unmet[0].status).toBe('unmet')
  })

  it('accepts any licence for a plain licence requirement', () => {
    const [req] = buildJobRequirements({ job: { require_drivers_license: true }, profile })
    expect(req.status).toBe('met')
  })

  it('will not judge a licence requirement that names a class', () => {
    // "Class A" and "CDL-A" are the same licence spelled two ways.
    const [req] = buildJobRequirements({
      job: { require_drivers_license: true, drivers_license_type: 'Class A' },
      profile,
    })
    expect(req.status).toBe('unknown')
  })

  it('lists the requirements it cannot check, without marking them', () => {
    const reqs = buildJobRequirements({
      job: {
        require_background_check: true,
        require_drug_test: true,
        security_clearance_required: 'Secret',
        travel_percentage: 40,
      },
      profile,
    })
    expect(reqs.map((r) => r.id)).toEqual([
      'background-check',
      'drug-test',
      'clearance',
      'travel',
    ])
    expect(reqs.every((r) => r.status === 'unknown')).toBe(true)
  })

  it('treats an empty work history as not-filled-in, never as unmet', () => {
    // The seeded office account has none. Marking that ✗ would tell someone
    // with twenty years on the tools that they do not qualify because they
    // have not typed it in yet.
    const [req] = buildJobRequirements({
      job: { minimum_years_experience: 3 },
      profile: { experience: [], education: [], driversLicenseClasses: [] },
    })
    expect(req.status).toBe('unknown')
  })

  it('treats an unrecorded licence as unknown, and a recorded empty one as unmet', () => {
    const unrecorded = buildJobRequirements({
      job: { require_drivers_license: true },
      profile: { driversLicenseClasses: null },
    })
    expect(unrecorded[0].status).toBe('unknown')

    const recordedEmpty = buildJobRequirements({
      job: { require_drivers_license: true },
      profile: { driversLicenseClasses: [] },
    })
    expect(recordedEmpty[0].status).toBe('unmet')
  })

  it('answers nothing for a signed-out visitor', () => {
    const reqs = buildJobRequirements({
      job: { minimum_education_level: 'high_school', minimum_years_experience: 1 },
      profile: undefined,
    })
    expect(reqs.every((r) => r.status === 'unknown')).toBe(true)
  })
})

describe('requirementsSummary', () => {
  it('counts only what could be checked', () => {
    expect(
      requirementsSummary([
        { id: 'a', label: 'a', status: 'met' },
        { id: 'b', label: 'b', status: 'unmet' },
        { id: 'c', label: 'c', status: 'unknown' },
      ]),
    ).toEqual({ met: 1, checkable: 2 })
  })

  it('returns null rather than "0 of 0" when nothing is checkable', () => {
    expect(requirementsSummary([{ id: 'a', label: 'a', status: 'unknown' }])).toBeNull()
    expect(requirementsSummary([])).toBeNull()
  })
})

describe('profileGaps (#1183)', () => {
  const empty = { education: [], experience: [], driversLicenseClasses: null }

  it('names the profile field behind each requirement the profile does not answer yet', () => {
    const reqs = buildJobRequirements({
      job: {
        minimum_education_level: 'high_school',
        minimum_years_experience: 4,
        require_drivers_license: true,
      },
      profile: empty,
    })
    expect(reqs.every((r) => r.status === 'unknown')).toBe(true)
    expect(profileGaps(reqs)).toEqual(['education', 'experience', 'drivers-license'])
  })

  it('never offers a profile field for drug tests, travel or background checks', () => {
    const reqs = buildJobRequirements({
      job: { require_drug_test: true, travel_percentage: 25, require_background_check: true },
      profile: empty,
    })
    expect(profileGaps(reqs)).toEqual([])
  })

  it('is not a gap when the entries exist but cannot be ranked', () => {
    const reqs = buildJobRequirements({
      job: { minimum_education_level: 'high_school' },
      profile: { education: [{ degree_type: 'apprenticeship' }] },
    })
    expect(reqs[0].status).toBe('unknown')
    expect(profileGaps(reqs)).toEqual([])
  })

  it('is not a gap when the licence requirement names a class the app cannot check', () => {
    const reqs = buildJobRequirements({
      job: { require_drivers_license: true, drivers_license_type: 'CDL-A' },
      profile: empty,
    })
    expect(profileGaps(reqs)).toEqual([])
  })

  it('has nothing to offer a signed-out visitor', () => {
    const reqs = buildJobRequirements({
      job: { minimum_education_level: 'high_school', minimum_years_experience: 1 },
      profile: undefined,
    })
    expect(profileGaps(reqs)).toEqual([])
  })

  it('drops a gap once the profile answers it', () => {
    const reqs = buildJobRequirements({
      job: { minimum_education_level: 'high_school' },
      profile: { education: [{ degree_type: 'ged' }] },
    })
    expect(reqs[0].status).toBe('met')
    expect(profileGaps(reqs)).toEqual([])
  })
})

describe('formatProfileGaps', () => {
  it('reads as a phrase for one, two or three gaps', () => {
    expect(formatProfileGaps(['education'])).toBe('education')
    expect(formatProfileGaps(['education', 'experience'])).toBe('education and work experience')
    expect(formatProfileGaps(['education', 'experience', 'drivers-license'])).toBe(
      "education, work experience and driver's licence",
    )
  })
})

describe('rowRequirementsSummary (#1180)', () => {
  const profile = {
    education: [{ degree_type: 'high_school' }],
    experience: [{ start_date: '2010-01-01', end_date: null, is_current: true }],
    driversLicenseClasses: ['C'],
  }

  it('scores a list row the way the detail screen does', () => {
    expect(
      rowRequirementsSummary(
        { minimum_education_level: 'bachelor', minimum_years_experience: 2 },
        profile,
      ),
    ).toEqual({ met: 1, checkable: 2 })
  })

  it('leaves a licence uncounted when the list payload does not say which class', () => {
    expect(rowRequirementsSummary({ require_drivers_license: true }, profile)).toBeNull()
    expect(
      rowRequirementsSummary({ require_drivers_license: true, drivers_license_type: null }, profile),
    ).toEqual({ met: 1, checkable: 1 })
  })

  it('shows no score when signed out or when nothing is checkable', () => {
    expect(rowRequirementsSummary({ minimum_education_level: 'high_school' }, undefined)).toBeNull()
    expect(rowRequirementsSummary({ require_drug_test: true }, profile)).toBeNull()
  })
})
