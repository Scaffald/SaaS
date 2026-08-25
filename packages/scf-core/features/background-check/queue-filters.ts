/**
 * Removable filter chips for the screening queue.
 *
 * The queue opens on `under_review` — it is not an unfiltered list, and until
 * now the only thing saying so was the current value of a dropdown. A processor
 * looking at four rows had no way to tell whether that was the whole queue or
 * the slice they happened to be filtered into, which is the same confusion that
 * made the strip read "Over SLA 0" while three cases were over (#635): a
 * filtered view presenting itself as the whole picture.
 *
 * A chip is louder than a select's own value, and it carries its own removal.
 *
 * Deliberately separate from the applications `filters.ts` rather than
 * generalised across both: the two screens filter on different things, and two
 * callers is not enough evidence to design a shared abstraction. The SHAPE is
 * kept identical on purpose, so the third caller has something to copy and the
 * eventual generalisation is obvious.
 */

export interface QueueFilterState {
  /** 'all' means no status narrowing. */
  status: string
  /** Free-text search across name, email, org, status and package. */
  search: string
}

export interface QueueFilterChip {
  id: 'status' | 'search'
  label: string
  value: string
}

/** How many filters are actually narrowing the queue. */
export function queueFilterCount(filters: QueueFilterState): number {
  let n = 0
  if (filters.status && filters.status !== 'all') n += 1
  if (filters.search.trim()) n += 1
  return n
}

/**
 * Chips for whatever is currently narrowing the queue.
 *
 * `statusLabel` is injected rather than looked up here so this module stays
 * free of the status metadata table — the caller already has it.
 */
export function queueFilterChips(
  filters: QueueFilterState,
  statusLabel: (status: string) => string
): QueueFilterChip[] {
  const chips: QueueFilterChip[] = []

  if (filters.status && filters.status !== 'all') {
    chips.push({ id: 'status', label: 'Status', value: statusLabel(filters.status) })
  }
  if (filters.search.trim()) {
    chips.push({ id: 'search', label: 'Search', value: filters.search.trim() })
  }

  return chips
}

/** Clearing one chip leaves the others alone. */
export function clearQueueFilter(
  filters: QueueFilterState,
  id: QueueFilterChip['id']
): QueueFilterState {
  // Clearing status returns to 'all', not to the 'under_review' default —
  // "remove this filter" has to mean remove it. Restoring the default would
  // leave the queue filtered by something the user just asked to be rid of,
  // and the chip would reappear looking like the click had failed.
  if (id === 'status') return { ...filters, status: 'all' }
  return { ...filters, search: '' }
}
