/**
 * Education (and experience) dates shifted one month back (#1358): the picker
 * went through a local-midnight `Date` and callers stored its UTC day, and the
 * display read a UTC-midnight `Date` with local getters. These run under real
 * non-UTC zones on both sides of Greenwich, where the old code was wrong.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { monthInputFromValue, monthValueFromInput } from '../month-value'
import { formatDate, formatDateRange } from '../date-formatting'

const ORIGINAL_TZ = process.env.TZ

// East of UTC the old write path stored the previous month's last day; west of
// UTC the old read path showed the previous month.
const ZONES = ['Asia/Tokyo', 'Europe/Berlin', 'America/Denver', 'Pacific/Honolulu']

afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
})

describe.each(ZONES)('month values in %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone
  })

  it('is really running in that zone', () => {
    // Guards the test itself: if TZ were ignored, every case below would pass
    // in UTC and prove nothing.
    expect(new Date(2024, 0, 1).getTimezoneOffset()).not.toBe(0)
  })

  it('stores the month that was typed', () => {
    expect(monthValueFromInput('2024-09')).toBe('2024-09-01')
    expect(monthValueFromInput('2024-01')).toBe('2024-01-01')
    expect(monthValueFromInput('2024-12')).toBe('2024-12-01')
  })

  it('shows the month that was stored', () => {
    expect(monthInputFromValue('2024-09-01')).toBe('2024-09')
    expect(monthInputFromValue('2024-01-01')).toBe('2024-01')
  })

  it('does not drift over repeated load/save cycles', () => {
    let stored = '2024-09-01'
    for (let i = 0; i < 12; i += 1) {
      stored = monthValueFromInput(monthInputFromValue(stored)) as string
    }
    expect(stored).toBe('2024-09-01')
  })

  it('displays the stored month', () => {
    expect(formatDate('2024-09-01')).toBe('Sep 2024')
    expect(formatDate('2024-01-01')).toBe('Jan 2024')
    expect(formatDateRange('2020-01-01', '2022-05-01', false)).toBe('Jan 2020 - May 2022')
  })
})

describe('monthValueFromInput', () => {
  it('is null until the text is a whole, valid month', () => {
    expect(monthValueFromInput('')).toBeNull()
    expect(monthValueFromInput('2')).toBeNull()
    expect(monthValueFromInput('2024-')).toBeNull()
    expect(monthValueFromInput('2024-13')).toBeNull()
    expect(monthValueFromInput('2024-00')).toBeNull()
    expect(monthValueFromInput('Sept 2024')).toBeNull()
  })

  it('pads a single-digit month', () => {
    expect(monthValueFromInput('2024-9')).toBe('2024-09-01')
  })
})

describe('monthInputFromValue', () => {
  it('is empty for nothing or junk', () => {
    expect(monthInputFromValue(null)).toBe('')
    expect(monthInputFromValue(undefined)).toBe('')
    expect(monthInputFromValue('')).toBe('')
    expect(monthInputFromValue('soon')).toBe('')
  })
})
