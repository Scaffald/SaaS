import { describe, expect, it } from 'vitest'
import { calculateTotalExperience } from '../experience-duration'

const NOW = new Date('2026-08-11T00:00:00Z')

describe('calculateTotalExperience', () => {
  it('returns zero for no entries', () => {
    expect(calculateTotalExperience([], NOW)).toEqual({ years: 0, months: 0 })
    expect(calculateTotalExperience(undefined, NOW)).toEqual({ years: 0, months: 0 })
    expect(calculateTotalExperience(null, NOW)).toEqual({ years: 0, months: 0 })
  })

  it('measures a closed role', () => {
    expect(
      calculateTotalExperience([{ start_date: '2018-06-01', end_date: '2022-02-28' }], NOW)
    ).toEqual({ years: 3, months: 8 })
  })

  // The visible half of #590: a worker with a full history saw "0 years 0 months".
  it('measures a current role against now', () => {
    expect(
      calculateTotalExperience(
        [{ start_date: '2022-03-01', end_date: null, is_current: true }],
        NOW
      )
    ).toEqual({ years: 4, months: 5 })
  })

  it('treats a missing end date as current even without the flag', () => {
    expect(calculateTotalExperience([{ start_date: '2025-08-01' }], NOW)).toEqual({
      years: 1,
      months: 0,
    })
  })

  it('sums several roles', () => {
    // Marcus Rivera's seeded history.
    const total = calculateTotalExperience(
      [
        { start_date: '2022-03-01', end_date: null, is_current: true },
        { start_date: '2018-06-01', end_date: '2022-02-28' },
        { start_date: '2017-05-01', end_date: '2017-11-30' },
      ],
      NOW
    )

    expect(total).toEqual({ years: 8, months: 7 })
  })

  it('rolls twelve months into a year', () => {
    expect(
      calculateTotalExperience([{ start_date: '2025-08-01', end_date: '2026-08-01' }], NOW)
    ).toEqual({ years: 1, months: 0 })
  })

  it('ignores entries with no start date', () => {
    expect(
      calculateTotalExperience([{ end_date: '2022-01-01' }, { start_date: null }], NOW)
    ).toEqual({ years: 0, months: 0 })
  })

  it('ignores unparseable dates rather than producing NaN', () => {
    expect(
      calculateTotalExperience([{ start_date: 'not-a-date', end_date: '2022-01-01' }], NOW)
    ).toEqual({ years: 0, months: 0 })
    expect(
      calculateTotalExperience([{ start_date: '2020-01-01', end_date: 'nonsense' }], NOW)
    ).toEqual({ years: 0, months: 0 })
  })

  it('clamps a backwards range to zero instead of subtracting', () => {
    expect(
      calculateTotalExperience([{ start_date: '2024-01-01', end_date: '2020-01-01' }], NOW)
    ).toEqual({ years: 0, months: 0 })
  })
})
