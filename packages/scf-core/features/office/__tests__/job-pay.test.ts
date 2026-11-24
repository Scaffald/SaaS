import { describe, expect, it } from 'vitest'
import { jobPayProblems } from '../job-pay'

describe('jobPayProblems (#1411, #1412)', () => {
  it('flags Min above Max', () => {
    // Boris: "$90,000 – $50,000" went live.
    expect(
      jobPayProblems({
        pay_range_min_cents: 9_000_000,
        pay_range_max_cents: 5_000_000,
        pay_range_type: 'salary',
      }).range
    ).toBe('Max pay must be at least Min pay.')
  })

  it('wants a type as soon as either amount is set', () => {
    expect(jobPayProblems({ pay_range_min_cents: 4_000 }).type).toBeDefined()
    expect(jobPayProblems({ pay_range_max_cents: 4_000, pay_range_type: '' }).type).toBeDefined()
  })

  it('passes a typed range, a typed single end, equal ends and no pay at all', () => {
    expect(jobPayProblems({})).toEqual({})
    expect(jobPayProblems({ pay_range_type: 'hourly' })).toEqual({})
    expect(jobPayProblems({ pay_range_min_cents: 4_000, pay_range_type: 'hourly' })).toEqual({})
    expect(
      jobPayProblems({ pay_range_min_cents: 4_000, pay_range_max_cents: 4_000, pay_range_type: 'hourly' })
    ).toEqual({})
  })
})
