/**
 * A background check as four steps, from the fourteen statuses the API has.
 *
 * The screen showed the raw status as a coloured pill and a percentage bar —
 * "Partially Completed 80%" — which tells someone waiting on a screening
 * neither what has happened nor what happens next. A check is really a short
 * sequence: it is requested, consent is given, the provider works on it, and
 * it comes back. The statuses map onto that sequence; nothing new is needed
 * from the backend.
 *
 * Terminal statuses that are not the happy ending (failed, cancelled,
 * refunded, expired) still complete the sequence — the check is over — but
 * carry their own outcome line, because "Complete" on its own would read as
 * a result the worker never got.
 */

import type { BackgroundCheckStatus } from './status.utils'
import { getStatusMetadata } from './status.utils'

export type StepState = 'done' | 'current' | 'upcoming'

export interface TimelineStep {
  id: 'requested' | 'consent' | 'in_progress' | 'complete'
  label: string
  /** What this step means for the worker, not for the provider. */
  hint: string
  state: StepState
}

/** How far through the four steps each status sits. */
const STATUS_STEP: Record<BackgroundCheckStatus, 0 | 1 | 2 | 3> = {
  pending: 0,
  invited: 1,
  submitted: 2,
  in_progress: 2,
  under_review: 2,
  partially_completed: 2,
  // A dispute is raised against a finished check, but the check is working
  // again until it resolves — so it sits at the provider step, not the end.
  disputed: 2,
  completed_clear: 3,
  completed_consider: 3,
  completed_not_clear: 3,
  failed: 3,
  cancelled: 3,
  expired: 3,
  refunded: 3,
}

const STEPS: Array<{ id: TimelineStep['id']; label: string; hint: string }> = [
  { id: 'requested', label: 'Requested', hint: 'The screening has been ordered.' },
  { id: 'consent', label: 'Consent', hint: 'You confirm what may be checked.' },
  { id: 'in_progress', label: 'With the provider', hint: 'They do the searching. This is the wait.' },
  { id: 'complete', label: 'Complete', hint: 'Results are back and shareable.' },
]

/**
 * Statuses where the sequence stopped rather than finished. The last step is
 * marked `current` rather than `done`, so the timeline does not show a
 * cancelled check as a completed one.
 */
const STOPPED = new Set<BackgroundCheckStatus>(['failed', 'cancelled', 'refunded', 'expired'])

export function buildCheckTimeline(status: BackgroundCheckStatus): TimelineStep[] {
  const index = STATUS_STEP[status] ?? 0
  const stopped = STOPPED.has(status)

  return STEPS.map((step, i) => ({
    ...step,
    state:
      i < index ? 'done' : i === index ? (stopped || index < 3 ? 'current' : 'done') : 'upcoming',
  }))
}

/**
 * One line under the timeline saying where the check actually stands, using
 * the description the status vocabulary already carries.
 */
export function timelineSummary(status: BackgroundCheckStatus): {
  label: string
  detail: string
  tone: 'neutral' | 'active' | 'attention'
} {
  const meta = getStatusMetadata(status)
  const tone =
    meta.tone === 'danger' || meta.tone === 'warning'
      ? 'attention'
      : meta.tone === 'success'
        ? 'active'
        : meta.tone === 'info'
          ? 'active'
          : 'neutral'
  return {
    label: meta.label,
    detail: meta.description ?? '',
    tone,
  }
}
