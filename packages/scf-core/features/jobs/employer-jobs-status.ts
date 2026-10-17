/**
 * An employer's own postings, and how long each has been open.
 *
 * The list drew the raw status in uppercase — OPEN, DRAFT, CLOSED — in one of
 * five hardcoded hex colours it kept in a lookup at the top of the route
 * file. Those five are the whole vocabulary an employer sees for their own
 * jobs, so they belong somewhere both the list and its tabs can read.
 */

export type JobListingStatus = 'draft' | 'open' | 'published' | 'paused' | 'closed' | 'archived'

export type ListingTone = 'neutral' | 'active' | 'attention'

export interface ListingStatusMeta {
  label: string
  /** What the status means for the posting, not for the database. */
  hint: string
  tone: ListingTone
}

const STATUS_META: Record<string, ListingStatusMeta> = {
  draft: { label: 'Draft', hint: 'Not visible to anyone yet.', tone: 'neutral' },
  // `open` and `published` are the same thing to an employer; the API has
  // used both spellings since the public listing was built.
  open: { label: 'Live', hint: 'Visible, and taking applications.', tone: 'active' },
  published: { label: 'Live', hint: 'Visible, and taking applications.', tone: 'active' },
  paused: { label: 'Paused', hint: 'Hidden for now. Applications are held.', tone: 'attention' },
  closed: { label: 'Closed', hint: 'No longer taking applications.', tone: 'neutral' },
  archived: { label: 'Archived', hint: 'Filed away.', tone: 'neutral' },
}

export function listingStatus(status: string): ListingStatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      hint: '',
      tone: 'neutral',
    }
  )
}

export type ListingFilter = 'all' | 'live' | 'draft' | 'closed'

const FILTER_STATUSES: Record<ListingFilter, string[] | null> = {
  all: null,
  live: ['open', 'published'],
  draft: ['draft', 'paused'],
  closed: ['closed', 'archived'],
}

export const LISTING_FILTERS: { key: ListingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'closed', label: 'Closed' },
]

export function statusesForListingFilter(filter: ListingFilter): string[] | null {
  return FILTER_STATUSES[filter]
}

/**
 * Whole days since the posting went up.
 *
 * `posted_at` when the row has one, otherwise `created_at` — a draft has
 * never been posted, so its age is how long it has been sitting unfinished,
 * which is the more useful number for a draft anyway. Returns null rather
 * than a negative count for a future date.
 */
export function daysOpen(
  postedAt: string | null | undefined,
  createdAt: string | null | undefined,
  now: Date = new Date()
): number | null {
  const raw = postedAt ?? createdAt
  if (!raw) return null
  const started = new Date(raw)
  if (Number.isNaN(started.getTime())) return null
  const days = Math.floor((now.getTime() - started.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}

/**
 * The word under a row's age.
 *
 * It said "open" for anything that had ever been posted, so a closed listing
 * read "98d OPEN" beside a Closed chip (#1084). The age counts from
 * `posted_at` whatever the status, so the caption says that and leaves the
 * status to the chip; a never-posted draft's age counts from `created_at`.
 */
export function listingAgeLabel(postedAt: string | null | undefined): string {
  return postedAt ? 'posted' : 'in draft'
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temp: 'Temporary',
  temporary: 'Temporary',
  intern: 'Internship',
  internship: 'Internship',
}

const wholeDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/**
 * "$40 – $58/hr" from a posting's cents, or null when it states no pay.
 *
 * Null rather than "Pay not listed": a missing range is the employer's own
 * omission on their own row, so the segment simply drops.
 */
export function listingPayRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  type: string | null | undefined
): string | null {
  if (!minCents && !maxCents) return null
  const low = minCents ? wholeDollars.format(minCents / 100) : null
  const high = maxCents ? wholeDollars.format(maxCents / 100) : null
  const range = low && high && low !== high ? `${low} – ${high}` : (low ?? high)
  const suffix = type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''
  return `${range}${suffix}`
}

/**
 * A row's meta line: city · type · pay (#1199).
 *
 * The row showed only the location, so two "Electrician" postings could not
 * be told apart by the thing that differs — what they pay. A posting has no
 * trade field, so the prototype's leading trade segment is left out rather
 * than guessed from the title.
 */
export function listingMetaLine(job: {
  location?: string | null
  employment_type?: string | null
  pay_range_min_cents?: number | null
  pay_range_max_cents?: number | null
  pay_range_type?: string | null
}): string {
  const type = job.employment_type
    ? (EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type.replace(/_/g, ' '))
    : null
  return [
    job.location?.trim() || null,
    type,
    listingPayRange(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type),
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * The status word a row carries inside its group, or null when the group's
 * title already says it — "Live" inside Live was the same word twice
 * (#1199). Not live and Closed each hold two statuses, so there the word
 * still tells a draft from a paused posting.
 */
export function statusWordInGroup(status: string, groupTitle: string): string | null {
  const label = listingStatus(status).label
  return label === groupTitle ? null : label
}
