/**
 * Candidate-detail header logic.
 *
 * Extracted from CandidateDetailContent so the rules are testable without
 * mounting a component that needs six SDK hooks and a tab system. The bugs
 * these replace (§12 #1, #2, #3, #15 of the ATS design brief) were all logic
 * absent rather than logic wrong — three buttons with no handlers, a name that
 * was never rendered, tabs with no counts — so the rules are worth stating
 * once, in one place, with tests.
 */

import type { ApplicationStatus } from './types'

export interface NextStage {
  status: ApplicationStatus
  /** What the advance button calls it. */
  label: string
}

/**
 * The stage a candidate advances INTO from where they are now.
 *
 * The header hard-coded "Advance to Interview" regardless of stage, which was
 * wrong for most of the pipeline: from `new` it skips Screening entirely, and
 * from a terminal stage there is nothing to advance to at all.
 *
 * `inquired` rejoins at Interview — an inquiry is a question asked during
 * screening, not a stage of its own to be promoted out of in sequence.
 */
const NEXT_STAGE: Partial<Record<ApplicationStatus, NextStage>> = {
  new: { status: 'screen', label: 'Screening' },
  screen: { status: 'interview', label: 'Interview' },
  inquired: { status: 'interview', label: 'Interview' },
  interview: { status: 'offer', label: 'Offer' },
  offer: { status: 'hired', label: 'Hired' },
}

/** Null on terminal stages, where the advance button should not render. */
export function nextStageFor(status: ApplicationStatus): NextStage | null {
  return NEXT_STAGE[status] ?? null
}

/**
 * Whether rejection is still available. A candidate who already withdrew
 * cannot be rejected — the two are distinct outcomes and collapsing them is
 * what breaks funnel conversion and EEO adverse-impact counts (#533).
 */
export function canReject(status: ApplicationStatus): boolean {
  return status !== 'rejected' && status !== 'withdrawn'
}

/**
 * Initials for the avatar. Two where the name gives two, so a 48px circle is
 * not a single lonely letter.
 */
export function initialsOf(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * The " · 3" a tab label carries.
 *
 * Empty while the count is unknown (still loading) AND when it is zero: a tab
 * reading "Notes · 0" is noise, and the absence of a suffix already says the
 * same thing. Only a real, non-zero count earns the space.
 */
export function countSuffix(count: number | null | undefined): string {
  if (count == null || count === 0) return ''
  return ` · ${count}`
}
