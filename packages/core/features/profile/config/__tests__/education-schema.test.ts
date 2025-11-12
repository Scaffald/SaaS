import { describe, expect, it } from 'vitest'

import { educationProfileSchema, singleEducationEntrySchema } from '../education-schema'

const baseEntry = {
  institution_name: 'State College',
  start_date: '2020-01-01',
  end_date: '2022-05-01',
} as const

describe('education schema validation', () => {
  it('allows manual institution entries without university id', () => {
    const result = singleEducationEntrySchema.parse({
      ...baseEntry,
      university_id: null,
      degree_type: 'Bachelor Degree',
    })

    expect(result.university_id).toBeNull()
    expect(result.is_verified).toBe(false)
  })

  it('requires custom degree when selecting Other', () => {
    const result = singleEducationEntrySchema.safeParse({
      ...baseEntry,
      degree_type: 'Other',
      custom_degree_type: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.format().custom_degree_type?._errors ?? []
      expect(errorMessages).toContain('Please specify the degree type')
    }
  })

  it('rejects GPA values outside allowed range', () => {
    const result = singleEducationEntrySchema.safeParse({
      ...baseEntry,
      gpa: 4.5,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.format().gpa?._errors ?? []
      expect(errorMessages).toContain('GPA must be between 0.0 and 4.0')
    }
  })

  it('rejects end dates that precede the start date', () => {
    const result = singleEducationEntrySchema.safeParse({
      ...baseEntry,
      start_date: '2020-01-01',
      end_date: '2019-12-01',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.format().end_date?._errors ?? []
      expect(errorMessages).toContain('End date must be after start date')
    }
  })

  it('allows current education with expected graduation date', () => {
    const result = singleEducationEntrySchema.parse({
      ...baseEntry,
      is_current: true,
      end_date: undefined,
      expected_graduation_date: '2025-05-01',
    })

    expect(result.is_current).toBe(true)
    expect(result.expected_graduation_date).toBe('2025-05-01')
  })

  it('requires institution name at the form level', () => {
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
      const entryErrors = result.error.format().education_entries?.[0]
      const messages = entryErrors?.institution_name?._errors ?? []
      expect(messages).toContain('Institution name is required')
    }
  })

  it('rejects missing end date when entry is not marked current', () => {
    const result = singleEducationEntrySchema.safeParse({
      ...baseEntry,
      end_date: undefined,
      is_current: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.format().end_date?._errors ?? []
      expect(messages).toContain('End date is required unless currently enrolled')
    }
  })

  it('enforces description length limit of 500 characters', () => {
    const overlongDescription = 'x'.repeat(501)
    const result = singleEducationEntrySchema.safeParse({
      ...baseEntry,
      description: overlongDescription,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.format().description?._errors ?? []
      expect(messages).toContain('Description cannot exceed 500 characters')
    }
  })
})
