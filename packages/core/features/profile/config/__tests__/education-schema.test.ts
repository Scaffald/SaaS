import { describe, expect, it } from 'vitest'

import { educationProfileSchema } from '../education-schema'

const baseEntry = {
  institution_name: 'Manual University',
  start_date: '2020-01-01',
  end_date: '2021-01-01',
  is_current: false,
} as const

describe('educationProfileSchema', () => {
  it('allows manual institution entries without a university id', () => {
    const result = educationProfileSchema.safeParse({
      education_level: 'Bachelor Degree',
      education_entries: [
        {
          ...baseEntry,
          university_id: null,
        },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.education_entries?.[0]?.is_verified).toBe(false)
    }
  })

  it('rejects entries without an institution name', () => {
    const result = educationProfileSchema.safeParse({
      education_entries: [
        {
          ...baseEntry,
          institution_name: '',
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Institution name is required')
    }
  })

  it('requires end date when not currently enrolled', () => {
    const result = educationProfileSchema.safeParse({
      education_entries: [
        {
          ...baseEntry,
          end_date: undefined,
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('End date is required'))).toBe(
        true,
      )
    }
  })

  it('permits current education without end date when expected graduation provided', () => {
    const result = educationProfileSchema.safeParse({
      education_entries: [
        {
          ...baseEntry,
          is_current: true,
          end_date: undefined,
          expected_graduation_date: '2026-06-01',
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects GPA values outside the valid range', () => {
    const result = educationProfileSchema.safeParse({
      education_entries: [
        {
          ...baseEntry,
          gpa: 4.5,
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('GPA must be between'))).toBe(
        true,
      )
    }
  })

  it('requires a custom label when degree type is Other', () => {
    const result = educationProfileSchema.safeParse({
      education_entries: [
        {
          ...baseEntry,
          degree_type: 'Other',
          custom_degree_type: undefined,
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message.includes('Please specify the degree type')),
      ).toBe(true)
    }
  })
})

