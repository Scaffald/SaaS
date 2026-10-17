import type { ATSApplication } from '../types'

/**
 * What the hire screen charges, and why.
 *
 * This maths used to live at the bottom of `ApplicationStatusChangeModal`,
 * below the component that rendered it, reachable only by opening a modal on
 * a kanban board — so the one calculation in the product that decides what an
 * employer is billed had no test and no name you could import. It is pure and
 * it lives here now (#836).
 */

export interface HireInputs {
  organizationId: string
  workerUserId: string
  jobId: string
  applicationId: string
  totalHireValueCents: number
  jobDurationDays: number
  hireStartDate: string
}

export interface HireSchedule {
  totalHireValueCents: number
  /** Percent of the hire value the success fee is. */
  feePercentage: number
  totalFeeCents: number
  /** Always 'single' since #1257: the whole fee is charged upfront. */
  paymentSchedule: 'single'
  upfrontPercentage: number
  upfrontAmountCents: number
  finalAmountCents: number
  finalDueDate: string
}

/** The success fee, as a percent of the hire value. Mirrors the api's FEE_PERCENTAGE. */
export const SUCCESS_FEE_PERCENTAGE = 10

/** A full-time year, used to turn an hourly rate into a hire value. */
const HOURS_PER_WEEK = 40
const WEEKS_PER_YEAR = 52

export function deriveHireInputs(application?: ATSApplication | null): HireInputs | null {
  if (!application) return null

  const organizationId = application.job.organizationId || application.organizationId
  const workerUserId = application.workerUserId || application.candidate.id

  if (!organizationId || !workerUserId) {
    return null
  }

  const payRangeMax = application.job.payRangeMaxCents ?? undefined
  const payRangeMin = application.job.payRangeMinCents ?? undefined
  const payType = application.job.payRangeType ?? 'salary'

  const baseAmount = payRangeMax ?? payRangeMin
  if (!baseAmount || baseAmount <= 0) {
    return null
  }

  let totalHireValueCents = baseAmount
  if (payType === 'hourly') {
    totalHireValueCents = Math.round(baseAmount * HOURS_PER_WEEK * WEEKS_PER_YEAR)
  }

  const jobDurationDays = payType === 'salary' ? 60 : 21

  const hireStartDate = normalizeDate(
    application.screeningAnswers.earliestStartDate || undefined // targetStartDate column doesn't exist in database yet
  )

  return {
    organizationId,
    workerUserId,
    jobId: application.job.id,
    applicationId: application.id,
    totalHireValueCents,
    jobDurationDays,
    hireStartDate,
  }
}

/**
 * What the employer pays, exactly as the api computes it (#1256, #1257): the
 * fee is 10% of the hire value and it is charged whole, upfront. This used to
 * split the *hire value* 20/80 or 50/50, so "Due now" showed ten times the
 * amount the server actually charged, and a "Due later" nothing ever billed.
 */
export function deriveSchedule(totalHireValueCents: number, hireStartDate: string): HireSchedule {
  const totalFeeCents = Math.round(totalHireValueCents * (SUCCESS_FEE_PERCENTAGE / 100))
  return {
    totalHireValueCents,
    feePercentage: SUCCESS_FEE_PERCENTAGE,
    totalFeeCents,
    paymentSchedule: 'single',
    upfrontPercentage: 100,
    upfrontAmountCents: totalFeeCents,
    finalAmountCents: 0,
    finalDueDate: hireStartDate,
  }
}

export function toISODate(date: Date): string {
  const [datePart] = date.toISOString().split('T')
  return datePart ?? ''
}

export function normalizeDate(value?: string): string {
  if (!value) return toISODate(new Date())
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return toISODate(new Date())
  }
  return toISODate(parsed)
}

/**
 * UTC throughout, deliberately.
 *
 * This used to parse "2026-03-01" (which JS reads as UTC midnight) and then
 * step it with `setDate`/`getDate`, which are local-time. West of UTC that
 * midnight is the previous evening, so the day count started a day early and
 * the final payment due date came out a day different depending on where the
 * employer happened to be sitting. A billing date must not depend on the
 * reader's timezone.
 */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const clone = new Date(date)
  clone.setUTCDate(clone.getUTCDate() + days)
  return toISODate(clone)
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

/**
 * "30 June 2026" rather than "2026-06-30", which is what the modal showed.
 *
 * Formatted in UTC for the same reason `addDays` counts in it: the date was
 * computed as a calendar date, so rendering it in the reader's timezone would
 * show a different day to an employer in Los Angeles than to one in Berlin.
 */
export function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
