import { describe, expect, it } from 'vitest'
import { normalizeEducationEntry } from '../education-entry'

const baseEntry = {
  id: 'education-1',
  institution_name: 'State University',
  degree_type: 'Bachelor Degree',
  field_of_study: 'Engineering',
  start_date: '2020-08-01',
} as const

describe('normalizeEducationEntry', () => {
  it('retains standard degree types and omits custom labels', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      custom_degree_type: 'Custom Label',
      is_verified: true,
      gpa: '3.75',
    })

    expect(result.degree_type).toBe('Bachelor Degree')
    expect(result.custom_degree_type).toBe('Custom Label')
    expect(result.is_verified).toBe(true)
    expect(result.gpa).toBeCloseTo(3.75)
  })

  it('maps non-standard degree to Other and preserves custom label', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      degree_type: 'international-diploma',
      custom_degree_type: 'International Diploma',
      end_date: null,
      expected_graduation_date: undefined,
      gpa: undefined,
    } as unknown as typeof baseEntry)

    expect(result.degree_type).toBe('Other')
    expect(result.custom_degree_type).toBe('international-diploma')
    expect(result.end_date).toBeUndefined()
    expect(result.expected_graduation_date).toBeUndefined()
  })
})
