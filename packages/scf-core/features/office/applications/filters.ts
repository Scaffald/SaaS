/**
 * Pipeline filter vocabulary and the derived state the toolbar renders.
 *
 * Kept out of the component so the two bugs this replaces cannot come back
 * silently: the status list was missing stages that exist on the board
 * (§12 #4), and `minScore` was sent to the API with no control to set it
 * (§12 #5). Both are "the list and the reality disagree" bugs, which is
 * exactly what a test over a shared constant catches.
 */

import type { ApplicationStatus } from './types'

/**
 * Every stage a candidate can be filtered to, in board order.
 *
 * `inquired` and `withdrawn` were both absent. `inquired` is a full column on
 * the board, so a whole stage was unreachable; `withdrawn` is a distinct
 * outcome from `rejected` and collapsing them is what the data model works to
 * prevent (#533).
 */
export const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All stages' },
  { value: 'new', label: 'New' },
  { value: 'screen', label: 'Screening' },
  { value: 'inquired', label: 'Inquired' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

/** Score floors an employer actually thinks in. 0 means "do not filter". */
export const SCORE_BANDS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Any score' },
  { value: 60, label: '60 and up' },
  { value: 70, label: '70 and up' },
  { value: 80, label: '80 and up' },
  { value: 90, label: '90 and up' },
]

export interface ApplicationFilterState {
  jobId: string | null
  status: ApplicationStatus | null
  minScore: number
}

export const EMPTY_FILTERS: ApplicationFilterState = {
  jobId: null,
  status: null,
  minScore: 0,
}

export function statusLabel(status: ApplicationStatus): string {
  return STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label ?? status
}

export function scoreLabel(minScore: number): string {
  return SCORE_BANDS.find((b) => b.value === minScore)?.label ?? `${minScore} and up`
}

/** How many filters are actually narrowing the list. Drives the flyout badge. */
export function activeFilterCount(filters: ApplicationFilterState): number {
  let n = 0
  if (filters.jobId) n += 1
  if (filters.status) n += 1
  if (filters.minScore > 0) n += 1
  return n
}

export interface FilterChipDescriptor {
  id: 'job' | 'status' | 'score'
  label: string
  value: string
}

/**
 * The removable chips for filters already applied, so they can be cleared
 * without reopening the flyout.
 */
export function filterChips(
  filters: ApplicationFilterState,
  jobs: Array<{ id: string; title: string }>,
): FilterChipDescriptor[] {
  const chips: FilterChipDescriptor[] = []

  if (filters.jobId) {
    const job = jobs.find((j) => j.id === filters.jobId)
    // A job that is no longer in the option list (closed since it was picked)
    // still gets a chip — otherwise the pipeline is silently filtered by
    // something the user cannot see or remove.
    chips.push({ id: 'job', label: 'Job', value: job?.title ?? 'Unknown job' })
  }
  if (filters.status) {
    chips.push({ id: 'status', label: 'Stage', value: statusLabel(filters.status) })
  }
  if (filters.minScore > 0) {
    chips.push({ id: 'score', label: 'Score', value: scoreLabel(filters.minScore) })
  }

  return chips
}

/** Clearing one chip leaves the others alone. */
export function clearFilter(
  filters: ApplicationFilterState,
  id: FilterChipDescriptor['id'],
): ApplicationFilterState {
  if (id === 'job') return { ...filters, jobId: null }
  if (id === 'status') return { ...filters, status: null }
  return { ...filters, minScore: 0 }
}
