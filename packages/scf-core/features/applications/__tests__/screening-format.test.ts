import { describe, expect, it } from 'vitest'
import {
  YEARS_EXPERIENCE_BUCKETS,
  bucketToYears,
  formatCustomAnswer,
  formatScreeningLocation,
  formatYearsExperience,
  screeningAnswerRows,
  yearsToBucket,
} from '../screening-format'

describe('years of experience buckets (#1415)', () => {
  it.each(YEARS_EXPERIENCE_BUCKETS.map((b) => b.value))('%s round-trips', (bucket) => {
    expect(yearsToBucket(bucketToYears(bucket))).toBe(bucket)
  })

  it('reads "5+" back as "5+", not "3-5"', () => {
    expect(bucketToYears('5+')).toBe(5)
    expect(yearsToBucket(5)).toBe('5+')
  })

  it('puts free-typed numbers in the bucket they belong to', () => {
    expect(yearsToBucket(0)).toBe('0-1')
    expect(yearsToBucket(1)).toBe('1-3')
    expect(yearsToBucket(3)).toBe('3-5')
    expect(yearsToBucket(12)).toBe('5+')
    expect(yearsToBucket(undefined)).toBeUndefined()
  })

  it('formats the open top bucket as 5+', () => {
    expect(formatYearsExperience(5)).toBe('5+ yrs')
    expect(formatYearsExperience(9)).toBe('5+ yrs')
    expect(formatYearsExperience(4)).toBe('4 yrs')
    expect(formatYearsExperience(1)).toBe('1 yr')
    expect(formatYearsExperience(null)).toBe('')
  })
})

describe('formatScreeningLocation (#1417)', () => {
  it('drops a trailing United States / USA', () => {
    expect(formatScreeningLocation('Detroit, Michigan, United States')).toBe('Detroit, Michigan')
    expect(formatScreeningLocation('Austin, TX, USA')).toBe('Austin, TX')
    expect(formatScreeningLocation('Detroit, Michigan')).toBe('Detroit, Michigan')
    expect(formatScreeningLocation(null)).toBe('')
  })
})

describe('screeningAnswerRows (#1416)', () => {
  const base = {
    current_location: 'Detroit, Michigan, United States',
    willing_to_relocate: false,
    years_experience: 5,
    is_authorized_to_work: true,
    earliest_start_date: 'Immediately',
  }

  it('prints no stray row for an empty custom_question_answers', () => {
    const rows = screeningAnswerRows({ ...base, custom_question_answers: [] })
    expect(rows.map((r) => r.label)).toEqual([
      'Location',
      'Willing to Relocate',
      'Years of Experience',
      'Authorized to Work in US',
      'Earliest Start Date',
    ])
    expect(rows.find((r) => r.key === 'years_experience')?.value).toBe('5+ yrs')
  })

  it('renders each custom question as question → answer and skips empties', () => {
    const rows = screeningAnswerRows({
      ...base,
      custom_question_answers: [
        { question: 'Do you own a truck?', answer: true },
        { question: 'Which tools?', answer: ['Drill', 'Saw'] },
        { question: 'Anything else?', answer: '' },
        { question: '', answer: 'orphan' },
      ],
    })
    const custom = rows.filter((r) => r.key.startsWith('custom_'))
    expect(custom).toEqual([
      { key: 'custom_0', label: 'Do you own a truck?', value: 'Yes' },
      { key: 'custom_1', label: 'Which tools?', value: 'Drill, Saw' },
    ])
    expect(rows.some((r) => r.value.includes('[object Object]'))).toBe(false)
  })

  it('skips empty fixed answers and unknown keys', () => {
    expect(screeningAnswerRows({ current_location: '', mystery_key: 'x' })).toEqual([])
    expect(screeningAnswerRows(null)).toEqual([])
  })

  it('formats custom answers', () => {
    expect(formatCustomAnswer(false)).toBe('No')
    expect(formatCustomAnswer(['a', '', 'b'])).toBe('a, b')
    expect(formatCustomAnswer(null)).toBe('')
  })
})
