import { describe, expect, it } from 'vitest'
import {
  buildCertificationsPayload,
  buildEducationPayload,
  buildEmploymentPayload,
  buildExperiencePayload,
  buildGeneralPayload,
  buildSkillsPayload,
} from '../wizard-to-profile'

describe('buildGeneralPayload', () => {
  it('maps the wizard field names onto the profile field names', () => {
    // The wizard says "bio"; the profile stores "about". Getting this wrong is
    // silent — the PATCH succeeds and the text lands nowhere visible.
    expect(
      buildGeneralPayload({
        general: { firstName: 'Marcus', lastName: 'Rivera', headline: 'Electrician', bio: 'Hi' },
      })
    ).toEqual({
      first_name: 'Marcus',
      last_name: 'Rivera',
      headline: 'Electrician',
      about: 'Hi',
    })
  })

  it('trims, and omits fields the user left blank', () => {
    expect(buildGeneralPayload({ general: { firstName: '  Marcus  ', lastName: '', bio: '   ' } })).toEqual(
      { first_name: 'Marcus' }
    )
  })

  it('returns null when the step is absent or empty', () => {
    expect(buildGeneralPayload({})).toBeNull()
    expect(buildGeneralPayload({ general: { firstName: '', lastName: '' } })).toBeNull()
  })
})

describe('buildExperiencePayload', () => {
  it('requires both job title and company, as the editor does', () => {
    expect(buildExperiencePayload({ experience: { jobTitle: 'Electrician' } })).toBeNull()
    expect(buildExperiencePayload({ experience: { companyName: 'Apex' } })).toBeNull()
  })

  it('drops the end date for a current role', () => {
    const payload = buildExperiencePayload({
      experience: {
        jobTitle: 'Electrician',
        companyName: 'Apex',
        startDate: '2022-03-01',
        endDate: '2024-01-01',
        isCurrent: true,
      },
    })

    expect(payload?.experience_entries[0]).toMatchObject({
      job_title: 'Electrician',
      company_name: 'Apex',
      start_date: '2022-03-01',
      end_date: null,
      is_current: true,
    })
  })

  it('keeps the end date for a past role', () => {
    const payload = buildExperiencePayload({
      experience: {
        jobTitle: 'Apprentice',
        companyName: 'Rocky Mountain',
        startDate: '2018-06-01',
        endDate: '2022-02-28',
        isCurrent: false,
      },
    })

    expect(payload?.experience_entries[0].end_date).toBe('2022-02-28')
  })
})

describe('buildCertificationsPayload', () => {
  it('keeps only entries with both a name and an issuer', () => {
    // The completion score requires both; a half-filled row would be written
    // and then not count for anything.
    const payload = buildCertificationsPayload({
      certifications: {
        certifications: [
          { name: 'OSHA 30', issuer: 'OSHA' },
          { name: 'Half filled', issuer: '' },
          { name: '', issuer: 'Nobody' },
        ],
      },
    })

    expect(payload?.certifications).toEqual([
      { name: 'OSHA 30', issuing_organization: 'OSHA', issue_date: null, expiration_date: null },
    ])
  })

  it('returns null when nothing survives the filter', () => {
    expect(
      buildCertificationsPayload({ certifications: { certifications: [{ name: 'x', issuer: '' }] } })
    ).toBeNull()
  })
})

describe('buildEmploymentPayload', () => {
  it('parses a currency-formatted rate', () => {
    expect(buildEmploymentPayload({ preferences: { hourlyRate: '$42.50' } })).toEqual({
      hourly_rate: 42.5,
    })
  })

  it('ignores a rate that is not a positive number', () => {
    expect(buildEmploymentPayload({ preferences: { hourlyRate: 'negotiable' } })).toBeNull()
    expect(buildEmploymentPayload({ preferences: { hourlyRate: '0' } })).toBeNull()
  })

  it('wraps single-value answers in the arrays the profile stores', () => {
    expect(
      buildEmploymentPayload({
        preferences: { availability: 'Full time', locationPreference: 'Denver, CO' },
      })
    ).toEqual({ availability: ['Full time'], preferred_work_locations: ['Denver, CO'] })
  })
})

describe('buildEducationPayload', () => {
  it('requires an institution', () => {
    expect(buildEducationPayload({ education: { degreeType: 'Associate' } })).toBeNull()
  })

  it('drops the end date while still enrolled', () => {
    const payload = buildEducationPayload({
      education: {
        institutionName: 'Front Range CC',
        degreeType: 'Associate',
        endDate: '2026-01-01',
        isCurrent: true,
      },
    })

    expect(payload?.education_entries[0]).toMatchObject({
      institution_name: 'Front Range CC',
      degree_type: 'Associate',
      end_date: null,
      is_current: true,
    })
  })
})

describe('buildSkillsPayload', () => {
  it('drops entries with no catalog id', () => {
    const payload = buildSkillsPayload({
      skills: {
        skills: [
          { id: 'abc', name: 'Electrical', taxonomy: 'csi', proficiency: 4 },
          { id: '', name: 'Typed but never picked', taxonomy: 'csi', proficiency: 3 },
        ],
      },
    })

    expect(payload?.skills).toEqual([
      { skill_id: 'abc', taxonomy: 'csi', proficiency_level: 4 },
    ])
  })

  it('returns null when no skill resolved to a catalog entry', () => {
    expect(buildSkillsPayload({ skills: { skills: [] } })).toBeNull()
  })
})
