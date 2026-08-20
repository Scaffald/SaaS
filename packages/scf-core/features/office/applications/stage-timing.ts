/**
 * Stage timing — how long a candidate has been sitting where they are.
 *
 * The board has always shown days since *applied*, which is a different and
 * much less useful number: a candidate who applied 30 days ago and moved to
 * Interview yesterday is not stale, and one who applied 8 days ago and has sat
 * untouched in New the whole time is. Days-in-stage is the signal that says
 * "act on this", and it is the number the SCF prototype leads every row with.
 *
 * It is derivable from real data: `stageHistory` carries the transitions
 * recorded in `core.application_activity`, so the clock starts at the most
 * recent entry into the current status. A candidate who has never moved has no
 * history, and their clock starts at `appliedAt` — which is correct rather than
 * a fallback, since entering the pipeline *is* their entry into `new`.
 */

import type { ApplicationStatus, ATSApplication } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * When the candidate entered the stage they are in now, as an epoch ms value.
 * Returns null when neither a transition nor an application date parses.
 */
export function stageEnteredAt(
  app: Pick<ATSApplication, 'status' | 'appliedAt' | 'stageHistory'>,
  now: number = Date.now(),
): number | null {
  const entries = (app.stageHistory ?? [])
    .filter((change) => change.toStage === app.status)
    .map((change) => new Date(change.changedAt).getTime())
    .filter((t) => Number.isFinite(t))
    // A clock that starts in the future would render as a negative age. Trust
    // the record's ordering, not its absolute values — local Supabase has been
    // observed running behind the host clock.
    .filter((t) => t <= now)

  if (entries.length > 0) {
    // Most recent entry into this stage — a candidate can be moved back.
    return Math.max(...entries)
  }

  const applied = new Date(app.appliedAt).getTime()
  return Number.isFinite(applied) ? Math.min(applied, now) : null
}

/**
 * Whole days the candidate has been in their current stage. Null when the
 * timestamps cannot be read — callers should omit the figure rather than
 * render a zero they cannot stand behind.
 */
export function daysInStage(
  app: Pick<ATSApplication, 'status' | 'appliedAt' | 'stageHistory'>,
  now: number = Date.now(),
): number | null {
  const enteredAt = stageEnteredAt(app, now)
  if (enteredAt == null) return null
  return Math.floor((now - enteredAt) / MS_PER_DAY)
}

/**
 * The compact form the prototype puts at the head of every row: "<1d", "8d".
 */
export function formatStageAge(days: number | null): string | null {
  if (days == null) return null
  return days < 1 ? '<1d' : `${days}d`
}

/**
 * How long a stage is allowed to take before the row should read as overdue.
 *
 * These are the promises the employer's public transparency stats are computed
 * against, so they are deliberately tight at the top of the funnel: the
 * first-response clock is the one candidates actually feel, and ghost rate is
 * computed from candidates left in `new`.
 *
 * Terminal stages have no promise — a hired or rejected candidate is not
 * waiting on anything, and marking them overdue would be noise.
 */
export const STAGE_SLA_DAYS: Partial<Record<ApplicationStatus, number>> = {
  new: 3,
  screen: 5,
  inquired: 5,
  interview: 7,
  offer: 5,
}

export function isStageOverdue(
  app: Pick<ATSApplication, 'status' | 'appliedAt' | 'stageHistory'>,
  now: number = Date.now(),
): boolean {
  const sla = STAGE_SLA_DAYS[app.status]
  if (sla == null) return false
  const days = daysInStage(app, now)
  return days != null && days > sla
}

/**
 * Why the row is flagged, in the reader's terms. The prototype pairs every
 * overdue age with a reason — "Overdue — screening decision" — because an
 * amber number on its own says something is wrong without saying what.
 */
const OVERDUE_REASON: Partial<Record<ApplicationStatus, string>> = {
  new: 'Overdue — no first response yet',
  screen: 'Overdue — screening decision',
  inquired: 'Overdue — awaiting inquiry reply',
  interview: 'Overdue — interview outcome',
  offer: 'Overdue — offer decision',
}

export function stageOverdueReason(
  app: Pick<ATSApplication, 'status' | 'appliedAt' | 'stageHistory'>,
  now: number = Date.now(),
): string | null {
  if (!isStageOverdue(app, now)) return null
  return OVERDUE_REASON[app.status] ?? 'Overdue'
}
