/**
 * Counts behind the Office overview (#1170).
 *
 * Kept out of office-overview.tsx so they can be tested without React Native.
 */

/**
 * A count read off a list that was fetched with a limit.
 *
 * `overflow` means the list came back full, so the true number is at least
 * `value` and possibly more. There is no count endpoint for some of these
 * sources, and a list's length is not one: the failed-notifications figure was
 * `rows.length` of a 50-row fetch, so it could never read above 50 (#1170).
 */
export interface BoundedCount {
  value: number
  overflow: boolean
}

/**
 * Count rows fetched with `limit: cap + 1`. One extra row is enough to tell
 * "exactly `cap`" from "more than `cap`" without fetching everything.
 */
export function boundedCount(rows: unknown, cap: number): BoundedCount | null {
  if (!Array.isArray(rows)) return null
  return rows.length > cap
    ? { value: cap, overflow: true }
    : { value: rows.length, overflow: false }
}

/**
 * Several queues read as one figure — the overview's "Screening queue" is
 * background checks, ID verifications and community verification together
 * (#1201). Unknown while any part is unknown: a partial sum would be a smaller
 * number presented as the whole. At least the sum when any part overflowed.
 */
export function sumBoundedCounts(counts: Array<BoundedCount | null>): BoundedCount | null {
  let value = 0
  let overflow = false
  for (const count of counts) {
    if (count == null) return null
    value += count.value
    overflow = overflow || count.overflow
  }
  return { value, overflow }
}

/** Statuses a violation report can no longer be decided from. */
const CLOSED_REPORT_STATUSES = new Set(['resolved', 'dismissed'])

export function isOpenReport(report: { status: string }): boolean {
  return !CLOSED_REPORT_STATUSES.has(report.status)
}

/**
 * Open violation reports in one page of the list. The endpoint pages at 50 and
 * the open filter runs here, so when the page is not the whole list the count
 * is a floor ("12+"), not the total.
 */
export function countOpenReports(
  page: { items: Array<{ status: string }>; totalCount: number } | null | undefined
): BoundedCount | null {
  if (!page || !Array.isArray(page.items)) return null
  return {
    value: page.items.filter(isOpenReport).length,
    overflow: page.totalCount > page.items.length,
  }
}

/** "—" while unknown, "50+" when the list was full, otherwise the number. */
export function formatBoundedCount(count: BoundedCount | null): string {
  if (count == null) return '—'
  return count.overflow ? `${count.value}+` : String(count.value)
}

export interface IdVerificationLike {
  badgeStatus: string
  rawBadgeStatus?: string | null
  verifiedAt: string | null
}

/**
 * ID verifications still waiting on a result.
 *
 * `core.id_verifications.badge_status` only knows active / expired / revoked
 * and defaults to `active`, so a paid check Persona has not reported back on
 * is an "active" row with no `verified_at`. The webhook sets `verified_at`
 * when it activates the badge, and a revoked or expired row is finished.
 */
export function countPendingIdVerifications(items: IdVerificationLike[]): number {
  return items.filter(
    (item) =>
      item.verifiedAt == null &&
      item.badgeStatus === 'active' &&
      (item.rawBadgeStatus == null || item.rawBadgeStatus === 'active')
  ).length
}
