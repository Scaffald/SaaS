/**
 * The employer's own transparency figures — response rate, median first
 * response, ghost rate.
 *
 * These are the product's differentiator: applicants choose where to apply
 * partly on numbers the employer cannot self-report. Showing an employer their
 * own ghost rate is the mechanism that changes behaviour, which is why the
 * prototype puts them in a banner labelled "candidates can see in" rather than
 * on a stats page nobody opens. It answers open question #5 of the ATS brief
 * (#539) with: loud.
 *
 * ─── What is and is not computed here ──────────────────────────────────────
 *
 * Everything below is derived from data the pipeline ALREADY loads:
 * `appliedAt` plus `stageHistory`, which the employer endpoint populates from
 * real `core.application_activity` rows. Nothing is invented, and nothing is
 * fetched.
 *
 * The WORKER-facing half of this feature — seeing an employer's stats before
 * applying — is deliberately not attempted. That needs an aggregate over
 * applications the worker cannot see, so it is a server computation and a new
 * endpoint, not a client calculation. Faking it from the applicant's own
 * handful of rows would produce a confident number computed from nothing,
 * which is the exact failure this codebase keeps finding (§12 #14's
 * placeholder legal copy, §12 #5's dead score filter, the dashboard's
 * hardcoded sparklines).
 */

import type { ApplicationStatus, ATSApplication } from './types'
import { daysInStage, STAGE_SLA_DAYS } from './stage-timing'

const MS_PER_DAY = 1000 * 60 * 60 * 24

type TimedApplication = Pick<ATSApplication, 'status' | 'appliedAt' | 'stageHistory'>

const TERMINAL: ApplicationStatus[] = ['hired', 'rejected', 'withdrawn']

/** How long an application waits before its absence of a reply counts against you. */
const FIRST_RESPONSE_SLA_DAYS = STAGE_SLA_DAYS.new ?? 3

/** Whether the candidate has ever heard anything: any move out of `new`. */
function hasBeenResponded(app: TimedApplication): boolean {
  return (app.stageHistory ?? []).some((change) => change.toStage !== 'new')
}

/** Days from applying to the first stage change, or null if there was none. */
function daysToFirstResponse(app: TimedApplication): number | null {
  const applied = new Date(app.appliedAt).getTime()
  if (!Number.isFinite(applied)) return null

  const firstMove = (app.stageHistory ?? [])
    .filter((change) => change.toStage !== 'new')
    .map((change) => new Date(change.changedAt).getTime())
    .filter((t) => Number.isFinite(t) && t >= applied)
    .sort((a, b) => a - b)[0]

  if (firstMove == null) return null
  return (firstMove - applied) / MS_PER_DAY
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export interface TransparencyStats {
  /**
   * Share of applications old enough to expect a reply that received one,
   * 0–100. Null when nothing is old enough to judge yet — an employer who
   * opened yesterday has no rate, and showing 0% would be a lie about them.
   */
  responseRatePct: number | null
  /** Median days from applying to first response. Null when none have moved. */
  medianFirstResponseDays: number | null
  /**
   * Share of OPEN applications currently sitting past their stage's promise,
   * 0–100.
   *
   * Deliberately not "1 − response rate", which would be the same number twice
   * under a different name. Ghosting is silence the candidate is experiencing
   * *now*, at any stage — a candidate stuck in Interview for three weeks is
   * being ghosted just as much as one never acknowledged, and the response
   * rate says nothing about them.
   */
  ghostRatePct: number | null
  /** Applications the response rate was computed over. */
  eligibleCount: number
  /** Open (non-terminal) applications the ghost rate was computed over. */
  openCount: number
}

export function computeTransparencyStats(
  applications: TimedApplication[],
  now: number = Date.now(),
): TransparencyStats {
  // Only applications that have had a fair chance count towards the response
  // rate. Counting one that arrived an hour ago as "no response" would make
  // the figure a measure of recent traffic rather than of behaviour.
  const eligible = applications.filter((app) => {
    const applied = new Date(app.appliedAt).getTime()
    if (!Number.isFinite(applied)) return false
    return (now - applied) / MS_PER_DAY >= FIRST_RESPONSE_SLA_DAYS
  })

  const responded = eligible.filter(hasBeenResponded)

  const firstResponseDays = applications
    .map(daysToFirstResponse)
    .filter((d): d is number => d != null)

  const open = applications.filter((app) => !TERMINAL.includes(app.status))
  const ghosted = open.filter((app) => {
    const sla = STAGE_SLA_DAYS[app.status]
    if (sla == null) return false
    const days = daysInStage(app, now)
    return days != null && days > sla
  })

  return {
    responseRatePct: eligible.length === 0 ? null : Math.round((responded.length / eligible.length) * 100),
    medianFirstResponseDays: median(firstResponseDays),
    ghostRatePct: open.length === 0 ? null : Math.round((ghosted.length / open.length) * 100),
    eligibleCount: eligible.length,
    openCount: open.length,
  }
}

/** "1.8d", or null when there is nothing to report. */
export function formatDays(days: number | null): string | null {
  if (days == null) return null
  return `${days.toFixed(1)}d`
}

/** "84%", or an em dash — never a confident 0 derived from no data. */
export function formatPct(pct: number | null): string {
  return pct == null ? '—' : `${pct}%`
}
