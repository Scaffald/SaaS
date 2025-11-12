import { describe, expect, it } from 'vitest'

import { formatDate, formatDateRange } from '../date-formatting'

describe('formatDate', () => {
  it('formats valid ISO strings to month and year', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 2024')
  })

  it('returns fallback when date is missing or invalid', () => {
    expect(formatDate(undefined)).toBe('N/A')
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateRange', () => {
  it('includes expected graduation when entry is current', () => {
    const result = formatDateRange('2023-09-15', null, true, '2025-05-15')
    expect(result).toBe('Sep 2023 - Present (Expected: May 2025)')
  })

  it('omits expected graduation when not provided for current entries', () => {
    const result = formatDateRange('2023-09-15', null, true)
    expect(result).toBe('Sep 2023 - Present')
  })

  it('formats completed education date ranges', () => {
    const result = formatDateRange('2020-01-15', '2022-01-15', false)
    expect(result).toBe('Jan 2020 - Jan 2022')
  })

  it('handles invalid end dates gracefully', () => {
    const result = formatDateRange('2020-01-15', 'invalid-date', false)
    expect(result).toBe('Jan 2020 - invalid-date')
  })
})