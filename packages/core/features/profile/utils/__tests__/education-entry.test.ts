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

  it('parses numeric GPA strings and strips whitespace', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      gpa: ' 3.2 ',
      is_verified: null,
    } as unknown as typeof baseEntry)

    expect(result.gpa).toBeCloseTo(3.2)
    expect(result.is_verified).toBe(false)
  })

  it('returns undefined for empty GPA values', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      gpa: '',
    } as unknown as typeof baseEntry)

    expect(result.gpa).toBeUndefined()
  })

  it('preserves expected graduation date when present', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      expected_graduation_date: '2026-06-01',
    } as unknown as typeof baseEntry)

    expect(result.expected_graduation_date).toBe('2026-06-01')
  })

  it('keeps current status and normalizes null end date', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      is_current: true,
      end_date: null,
    } as unknown as typeof baseEntry)

    expect(result.is_current).toBe(true)
    expect(result.end_date).toBeUndefined()
  })

  it('returns undefined degree type when no value provided', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      degree_type: undefined,
      custom_degree_type: undefined,
    } as unknown as typeof baseEntry)

    expect(result.degree_type).toBeUndefined()
    expect(result.custom_degree_type).toBeUndefined()
  })

  it('prefers custom degree label when stored degree type is missing', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      degree_type: null,
      custom_degree_type: 'Diploma of Fine Arts',
    } as unknown as typeof baseEntry)

    expect(result.degree_type).toBeUndefined()
    expect(result.custom_degree_type).toBe('Diploma of Fine Arts')
  })

  it('drops invalid GPA strings that cannot be parsed', () => {
    const result = normalizeEducationEntry({
      ...baseEntry,
      gpa: 'not-a-number',
    } as unknown as typeof baseEntry)

    expect(result.gpa).toBeUndefined()
  })
})
