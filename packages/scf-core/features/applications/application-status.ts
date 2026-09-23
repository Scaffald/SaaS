/**
 * One status vocabulary for the worker's own applications.
 *
 * The same eight database statuses were being named three ways: the badge
 * said "Under Review", the filter chips said "Active", and the next-step
 * line on each card said "Employer is reviewing your application". A worker
 * reading their own list had to work out that all three meant one thing.
 *
 * These are the worker-facing names — what the *applicant* is told, which is
 * not always what the employer's pipeline calls the same column. "rejected"
 * is "Not selected" here and "Rejected" on the board; "pending" is "Applied",
 * because from the worker's side the application is not pending anything
 * they can do.
 */

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'inquired'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export type StatusTone = 'neutral' | 'active' | 'attention'

export interface ApplicationStage {
  status: ApplicationStatus
  /** What the worker is told this application is doing. */
  label: string
  /** One line on what the stage means for them, not for the employer. */
  hint: string
  tone: StatusTone
}

/**
 * Stage order, as an application actually moves. Groups render in this order
 * and empty ones are left out, so the list reads as a path rather than a
 * fixed set of eight headings with seven of them empty.
 */
export const APPLICATION_STAGES: ApplicationStage[] = [
  {
    status: 'offer',
    label: 'Offer',
    hint: 'The employer has made you an offer — it is waiting on your answer.',
    tone: 'attention',
  },
  {
    status: 'inquired',
    label: 'Question for you',
    hint: 'The employer asked something and is waiting to hear back.',
    tone: 'attention',
  },
  {
    status: 'interview',
    label: 'Interview',
    hint: 'You are through to an interview.',
    tone: 'active',
  },
  {
    status: 'reviewing',
    label: 'Under review',
    hint: 'Someone is reading your application.',
    tone: 'active',
  },
  {
    status: 'pending',
    label: 'Applied',
    hint: 'Sent. Nothing is needed from you yet.',
    tone: 'neutral',
  },
  {
    status: 'hired',
    label: 'Hired',
    hint: 'You got the job.',
    tone: 'active',
  },
  {
    status: 'rejected',
    label: 'Not selected',
    hint: 'This one did not go your way.',
    tone: 'neutral',
  },
  {
    status: 'withdrawn',
    label: 'Withdrawn',
    hint: 'You took this application back.',
    tone: 'neutral',
  },
]

const BY_STATUS = new Map(APPLICATION_STAGES.map((stage) => [stage.status, stage]))

export function applicationStage(status: string): ApplicationStage {
  return (
    BY_STATUS.get(status as ApplicationStatus) ?? {
      status: status as ApplicationStatus,
      label: status,
      hint: '',
      tone: 'neutral',
    }
  )
}

export type FilterGroup = 'all' | 'active' | 'interview' | 'offers' | 'closed'

/**
 * The partition the tabs offer. `null` means "everything" — an explicit
 * value rather than a special case at each call site.
 */
const FILTER_STATUSES: Record<FilterGroup, ApplicationStatus[] | null> = {
  all: null,
  active: ['pending', 'reviewing', 'inquired'],
  interview: ['interview'],
  offers: ['offer'],
  closed: ['hired', 'rejected', 'withdrawn'],
}

export const FILTER_GROUPS: { key: FilterGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'interview', label: 'Interview' },
  { key: 'offers', label: 'Offers' },
  { key: 'closed', label: 'Closed' },
]

export function statusesForFilter(filter: FilterGroup): ApplicationStatus[] | null {
  return FILTER_STATUSES[filter]
}

/**
 * "12d" — whole days in the current stage, from `stage_changed_at`.
 *
 * Days in *this* stage, not days since applying: the question a worker has
 * about a stalled application is how long it has been sitting where it is.
 * Returns null when the row has never moved, because then the only honest
 * figure is the applied date, which the row already shows.
 */
export function daysInStage(
  stageChangedAt: string | null | undefined,
  now: Date = new Date()
): number | null {
  if (!stageChangedAt) return null
  const changed = new Date(stageChangedAt)
  if (Number.isNaN(changed.getTime())) return null
  const days = Math.floor((now.getTime() - changed.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}
