import { describe, expect, it } from 'vitest'
import type { ATSApplication } from '../../types'
import {
  addDays,
  deriveHireInputs,
  deriveSchedule,
  formatCents,
  formatDueDate,
  normalizeDate,
} from '../hire-schedule'

function application(overrides: Partial<ATSApplication> = {}): ATSApplication {
  return {
    id: 'app-1',
    organizationId: 'org-1',
    workerUserId: 'worker-1',
    candidate: { id: 'cand-1', name: 'Ada Blue' },
    job: {
      id: 'job-1',
      organizationId: 'org-1',
      title: 'Journeyman Electrician',
      payRangeMinCents: 8_000_000,
      payRangeMaxCents: 9_000_000,
      payRangeType: 'salary',
    },
    status: 'offer',
    appliedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    score: 70,
    screeningAnswers: {
      currentLocation: 'Detroit',
      willingToRelocate: false,
      yearsExperience: 10,
      isAuthorizedToWork: true,
      earliestStartDate: '2026-03-01',
    },
    customAnswers: [],
    attachments: {},
    ...overrides,
  } as unknown as ATSApplication
}

describe('deriveHireInputs', () => {
  it('bills against the top of the pay range', () => {
    expect(deriveHireInputs(application())?.totalHireValueCents).toBe(9_000_000)
  })

  it('falls back to the bottom of the range when there is no top', () => {
    const app = application({
      job: { ...application().job, payRangeMaxCents: null },
    } as Partial<ATSApplication>)
    expect(deriveHireInputs(app)?.totalHireValueCents).toBe(8_000_000)
  })

  it('annualises an hourly rate at 40 hours for 52 weeks', () => {
    const app = application({
      job: { ...application().job, payRangeMaxCents: 7_500, payRangeType: 'hourly' },
    } as Partial<ATSApplication>)
    expect(deriveHireInputs(app)?.totalHireValueCents).toBe(7_500 * 40 * 52)
  })

  /**
   * The screen must be able to tell "we cannot price this" apart from "this
   * hire is worth nothing" — it renders a different thing for each.
   */
  it('returns null rather than a zero fee when the job has no pay range', () => {
    const app = application({
      job: { ...application().job, payRangeMinCents: null, payRangeMaxCents: null },
    } as Partial<ATSApplication>)
    expect(deriveHireInputs(app)).toBeNull()
  })

  it('returns null when there is no organisation or no worker to bill', () => {
    expect(
      deriveHireInputs(
        application({
          organizationId: null,
          job: { ...application().job, organizationId: null },
        } as Partial<ATSApplication>)
      )
    ).toBeNull()
    expect(
      deriveHireInputs(
        application({
          workerUserId: null,
          candidate: { ...application().candidate, id: '' },
        } as unknown as Partial<ATSApplication>)
      )
    ).toBeNull()
  })

  it('does not trust the application to carry a usable start date', () => {
    const app = application({
      screeningAnswers: { ...application().screeningAnswers, earliestStartDate: 'not a date' },
    } as Partial<ATSApplication>)
    expect(deriveHireInputs(app)?.hireStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('deriveSchedule', () => {
  it('takes 20% upfront on a job of 30 days or more', () => {
    const schedule = deriveSchedule(10_000_000, 60, '2026-03-01')
    expect(schedule.paymentSchedule).toBe('standard')
    expect(schedule.upfrontPercentage).toBe(20)
    expect(schedule.upfrontAmountCents).toBe(2_000_000)
    expect(schedule.finalAmountCents).toBe(8_000_000)
    expect(schedule.finalDueDate).toBe('2026-03-31')
  })

  it('takes 50% upfront on a short job, and bills the rest at its end', () => {
    const schedule = deriveSchedule(1_000_000, 21, '2026-03-01')
    expect(schedule.paymentSchedule).toBe('short')
    expect(schedule.upfrontPercentage).toBe(50)
    expect(schedule.upfrontAmountCents).toBe(500_000)
    expect(schedule.finalDueDate).toBe('2026-03-22')
  })

  /** 30 days is the boundary, and it belongs to the standard schedule. */
  it('treats exactly 30 days as standard', () => {
    expect(deriveSchedule(1_000, 30, '2026-03-01').upfrontPercentage).toBe(20)
    expect(deriveSchedule(1_000, 29, '2026-03-01').upfrontPercentage).toBe(50)
  })

  it('never lets rounding make the two parts add up to more than the whole', () => {
    for (const total of [1, 3, 7, 33, 101, 999_999]) {
      const schedule = deriveSchedule(total, 60, '2026-03-01')
      expect(schedule.upfrontAmountCents + schedule.finalAmountCents).toBe(total)
      expect(schedule.finalAmountCents).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('date helpers', () => {
  it('crosses a month and a year boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-15', 30)).toBe('2027-01-14')
  })

  it('hands back a date it cannot parse rather than inventing one', () => {
    expect(addDays('tomorrow', 30)).toBe('tomorrow')
  })

  it('normalises a timestamp down to its date', () => {
    expect(normalizeDate('2026-03-01T18:45:00.000Z')).toBe('2026-03-01')
  })
})

describe('formatCents', () => {
  it('reads as money, not as cents', () => {
    expect(formatCents(2_000_000)).toBe('$20,000')
  })
})

describe('formatDueDate', () => {
  /**
   * The date is a calendar date, so it must render as the same day wherever
   * it is read. Formatted in the local zone it slips to the previous day for
   * every employer west of UTC.
   */
  it('shows the day it was calculated for, not the local day', () => {
    expect(formatDueDate('2026-03-31')).toContain('31')
    expect(formatDueDate('2026-01-01')).toContain('2026')
  })

  it('hands back what it cannot parse', () => {
    expect(formatDueDate('soon')).toBe('soon')
  })
})
