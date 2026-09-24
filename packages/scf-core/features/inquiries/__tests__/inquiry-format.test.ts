import { describe, expect, it } from 'vitest'
import {
  formatEmploymentType,
  formatRateRange,
  formatTermDate,
  formatTermTime,
  formatWorkSchedule,
  formatWorkdays,
  formatWorkingHours,
} from '../inquiry-format'

describe('formatTermDate', () => {
  /**
   * The bug this function exists to stop: an employment start date stored as
   * the 3rd rendered as "November 2, 2026" for every reader west of UTC,
   * because a date-only string parses as UTC midnight and was then formatted
   * in the reader's own zone.
   */
  it('shows the stored day, whatever zone the reader is in', () => {
    expect(formatTermDate('2026-11-03')).toBe('November 3, 2026')
    expect(formatTermDate('2026-01-01')).toBe('January 1, 2026')
    expect(formatTermDate('2026-12-31')).toBe('December 31, 2026')
  })

  it('says so rather than showing "Invalid Date"', () => {
    expect(formatTermDate('whenever')).toBe('Not specified')
    expect(formatTermDate(null)).toBe('Not specified')
    expect(formatTermDate(undefined)).toBe('Not specified')
    expect(formatTermDate('')).toBe('Not specified')
  })
})

describe('formatTermTime', () => {
  it('drops the seconds Postgres sends back', () => {
    expect(formatTermTime('07:00:00')).toBe('07:00')
    expect(formatTermTime('15:30:00')).toBe('15:30')
  })

  it('pads a single-digit hour so times line up in a column', () => {
    expect(formatTermTime('7:05')).toBe('07:05')
  })

  it('leaves something it does not recognise alone', () => {
    expect(formatTermTime('mornings')).toBe('mornings')
    expect(formatTermTime(null)).toBe('')
  })
})

describe('formatWorkingHours', () => {
  it('reads as a range, with the zone it is stated in', () => {
    expect(formatWorkingHours('07:00:00', '15:30:00', 'America/New_York')).toBe(
      '07:00 – 15:30 (America/New_York)'
    )
  })

  it('omits an absent zone rather than printing empty brackets', () => {
    expect(formatWorkingHours('07:00:00', '15:30:00', null)).toBe('07:00 – 15:30')
  })

  it('needs both ends to be a range', () => {
    expect(formatWorkingHours('07:00:00', null)).toBe('Not specified')
    expect(formatWorkingHours(null, '15:30:00')).toBe('Not specified')
  })
})

describe('formatWorkdays', () => {
  it('abbreviates, in the order given', () => {
    expect(formatWorkdays(['monday', 'wednesday', 'friday'])).toBe('Mon, Wed, Fri')
  })

  it('passes through a day it does not know rather than dropping it', () => {
    expect(formatWorkdays(['monday', 'funday'])).toBe('Mon, funday')
  })

  it('handles the empty and the not-an-array cases', () => {
    expect(formatWorkdays([])).toBe('Not specified')
    expect(formatWorkdays(null)).toBe('Not specified')
    expect(formatWorkdays('monday')).toBe('Not specified')
  })
})

describe('formatRateRange', () => {
  it('writes a range when there are two ends', () => {
    expect(formatRateRange(5200, 6400, 'hourly')).toBe('$52.00 – $64.00 /hr')
  })

  /** A range whose ends are equal is a single rate, and should read as one. */
  it('collapses a range with one value', () => {
    expect(formatRateRange(5200, 5200, 'hourly')).toBe('$52.00 /hr')
    expect(formatRateRange(5200, undefined, 'hourly')).toBe('$52.00 /hr')
  })

  it('says per year for anything that is not hourly', () => {
    expect(formatRateRange(9_000_000, undefined, 'salary')).toBe('$90000.00 /yr')
  })

  it('will not print a rate it does not have', () => {
    expect(formatRateRange(0, 6400, 'hourly')).toBe('Not specified')
    expect(formatRateRange(null, null, 'hourly')).toBe('Not specified')
  })
})

describe('term labels', () => {
  it('names the values the schema actually stores', () => {
    expect(formatEmploymentType('permanent')).toBe('Permanent')
    expect(formatEmploymentType('temporary')).toBe('Temporary')
    expect(formatWorkSchedule('full_time')).toBe('Full time')
    expect(formatWorkSchedule('part_time')).toBe('Part time')
    expect(formatWorkSchedule('day_week')).toBe('Day-Week')
  })

  /**
   * Null rather than a guess. The candidate's view used to render any
   * unrecognised employment type as "Temporary" via an `=== 'permanent' ? :`
   * ternary, so a value the UI had not been taught became a specific — and
   * wrong — claim about the offer.
   */
  it('returns null for a value it has not been taught', () => {
    expect(formatEmploymentType('seasonal')).toBeNull()
    expect(formatEmploymentType(null)).toBeNull()
    expect(formatWorkSchedule('compressed')).toBeNull()
  })
})
