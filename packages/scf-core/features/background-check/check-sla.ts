/**
 * Turnaround and SLA for background checks — the layer the NationSearch case
 * queue is built around.
 *
 * The prototype's queue leads every row with age and states a promise against
 * it: over SLA, due today, on time. Its own tip says why — "age in stage is
 * the loudest thing on every row; five days in Submitted is a phone call
 * somebody forgot to make". A queue that shows status but not elapsed time
 * tells a processor what a case IS, not which one to pick up.
 *
 * ─── Where the promise comes from ──────────────────────────────────────────
 *
 * The prototype promises turnaround per PACKAGE ("Standard", "Standard + MVR",
 * "Standard + credit"). Our `AdminCheckPackage` carries only id, display_name
 * and slug — there is no turnaround column to read, and inventing per-package
 * day counts here would be a made-up number wearing a real label.
 *
 * So the promise is per STATUS instead: how long a check should sit in its
 * current state before somebody chases it. That is honestly derivable from
 * data we have, and it is the same signal the queue actually needs. Moving to
 * a real per-package promise means adding it to the package record first —
 * worth doing, and deliberately not faked in the meantime.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * States a check can sit in without anybody being at fault, and how long each
 * should take before it needs chasing.
 *
 * `invited` is the longest because the ball is with the applicant, not the
 * processor — chasing at three days would be nagging someone who is simply
 * gathering documents.
 */
export const CHECK_SLA_DAYS: Record<string, number> = {
  pending: 2,
  invited: 7,
  submitted: 3,
  in_progress: 5,
  under_review: 2,
  partially_completed: 3,
  disputed: 5,
}

/**
 * Terminal states. A finished check is not late however long ago it finished,
 * and a cancelled one is not waiting on anybody.
 */
const TERMINAL = new Set([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'cancelled',
  'expired',
  'refunded',
])

export interface TimedCheck {
  status: string | null
  created_at: string
  updated_at?: string | null
  completed_at?: string | null
}

export type SlaState = 'over' | 'due-today' | 'on-time' | 'none'

/**
 * Days since the check last changed hands.
 *
 * `updated_at` rather than `created_at`: a case that moved to `under_review`
 * yesterday has been in review one day, not the twenty since it was opened.
 * Falls back to `created_at` for a check that has never moved.
 */
export function daysInState(check: TimedCheck, now: number = Date.now()): number | null {
  const stamp = check.updated_at ?? check.created_at
  const t = new Date(stamp).getTime()
  if (!Number.isFinite(t)) return null
  // Clamp rather than report a negative age — local Supabase has been observed
  // running behind the host clock.
  return Math.floor(Math.max(0, now - t) / MS_PER_DAY)
}

/** Whole days remaining against the promise. Null when there is no promise. */
export function daysRemaining(check: TimedCheck, now: number = Date.now()): number | null {
  const status = check.status ?? ''
  const sla = CHECK_SLA_DAYS[status]
  if (sla == null || TERMINAL.has(status)) return null
  const elapsed = daysInState(check, now)
  if (elapsed == null) return null
  return sla - elapsed
}

export function slaState(check: TimedCheck, now: number = Date.now()): SlaState {
  const remaining = daysRemaining(check, now)
  if (remaining == null) return 'none'
  if (remaining < 0) return 'over'
  if (remaining === 0) return 'due-today'
  return 'on-time'
}

export function isTerminal(status: string | null): boolean {
  return TERMINAL.has(status ?? '')
}

export interface QueueMetrics {
  openCount: number
  overSlaCount: number
  dueTodayCount: number
  /** Median days open across OPEN cases. Null when none are open. */
  medianDaysOpen: number | null
}

export function computeQueueMetrics(
  checks: TimedCheck[],
  now: number = Date.now(),
): QueueMetrics {
  const open = checks.filter((c) => !isTerminal(c.status))

  const ages = open
    .map((c) => daysInState(c, now))
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b)

  const medianDaysOpen =
    ages.length === 0
      ? null
      : ages.length % 2 === 0
        ? (ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2
        : ages[Math.floor(ages.length / 2)]

  return {
    openCount: open.length,
    overSlaCount: open.filter((c) => slaState(c, now) === 'over').length,
    dueTodayCount: open.filter((c) => slaState(c, now) === 'due-today').length,
    medianDaysOpen,
  }
}

/** "3d over", "due today", "2d left" — the phrase the row carries. */
export function slaLabel(check: TimedCheck, now: number = Date.now()): string | null {
  const remaining = daysRemaining(check, now)
  if (remaining == null) return null
  if (remaining < 0) return `${Math.abs(remaining)}d over`
  if (remaining === 0) return 'due today'
  return `${remaining}d left`
}
