import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange } from '../date-formatting'

describe('date-formatting utilities', () => {
  it('formats single dates with fallback for invalid input', () => {
    expect(formatDate('2025-03-15T00:00:00Z')).toBe('Mar 2025')
    expect(formatDate(null)).toBe('N/A')
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('formats ongoing date ranges with expected graduation information', () => {
    expect(formatDateRange('2024-01-15T00:00:00Z', null, true)).toBe('Jan 2024 - Present')
    expect(formatDateRange('2024-01-15T00:00:00Z', null, true, '2024-06-20T00:00:00Z')).toBe(
      'Jan 2024 - Present (Expected: Jun 2024)',
    )
  })

  it('formats completed date ranges', () => {
    expect(formatDateRange('2023-02-15T00:00:00Z', '2024-02-15T00:00:00Z', false)).toBe(
      'Feb 2023 - Feb 2024',
    )
  })
})
