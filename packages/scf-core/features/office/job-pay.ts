/**
 * The pay rules the job form checks before it submits (#1411, #1412), in the
 * same words the api answers with (functions/api/lib/job-pay.ts), which
 * migration 399 also holds as CHECK constraints.
 *
 * - Min above Max went live as "$90,000 – $50,000": nothing checked the order.
 * - An amount without a pay type was invisible to workers, and the form said
 *   nothing, so a type is required as soon as either amount is set.
 *
 * Pure, so vitest reaches it without RN.
 */

export interface JobPayFields {
  pay_range_min_cents?: number | null
  pay_range_max_cents?: number | null
  pay_range_type?: string | null
}

export interface JobPayProblems {
  /** Under the Max input: Min is above Max. */
  range?: string
  /** On the pay type select: an amount with no type. */
  type?: string
}

const isAmount = (cents: number | null | undefined): cents is number => typeof cents === 'number'

export function jobPayProblems(pay: JobPayFields): JobPayProblems {
  const problems: JobPayProblems = {}
  const min = pay.pay_range_min_cents
  const max = pay.pay_range_max_cents
  if (isAmount(min) && isAmount(max) && min > max) {
    problems.range = 'Max pay must be at least Min pay.'
  }
  if ((isAmount(min) || isAmount(max)) && !pay.pay_range_type) {
    problems.type = 'Choose a pay type (hourly, salary, contract or project).'
  }
  return problems
}
