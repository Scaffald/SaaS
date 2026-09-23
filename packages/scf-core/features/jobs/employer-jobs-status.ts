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
  now: Date = new Date(),
): number | null {
  const raw = postedAt ?? createdAt
  if (!raw) return null
  const started = new Date(raw)
  if (Number.isNaN(started.getTime())) return null
  const days = Math.floor((now.getTime() - started.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}
