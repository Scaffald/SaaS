/**
 * The unread badge, counted from the same rows the inbox shows (#1250).
 *
 * The inbox filters by app mode on the client (#1178, `audience.ts`), but the
 * badge read `/v1/notifications/unread-count`, which knows nothing about mode.
 * An unread employer-only notification lit the badge in worker mode, and
 * opening the inbox showed nothing new. The count endpoint has no audience
 * filter and the SDK's `getUnreadCount()` takes no parameters, so the badge is
 * counted here from the unread rows, through the same filter as the list.
 */
import type { AppMode } from '@scf/core/utils/useAppMode'
import { filterNotificationsForMode } from './audience'

/**
 * Unread rows fetched per count. The list endpoint's maximum page; beyond it
 * the count is a floor and says so.
 */
export const UNREAD_PAGE_LIMIT = 100

export interface ModeUnreadCount {
  value: number
  /** More unread rows exist than were fetched, so `value` is at least this. */
  overflow: boolean
}

type UnreadPage = {
  data?: Array<{ type?: string; read?: boolean }> | null
  pagination?: { total?: number } | null
}

/**
 * Unread notifications for this mode in one page of unread rows. Null while
 * the page has not loaded, so a badge never shows a confident 0 first.
 *
 * Rows are re-checked for `read` because opening a row marks it read in the
 * cached list before the request lands; the badge should drop on the tap.
 */
export function countUnreadForMode(
  page: UnreadPage | null | undefined,
  mode: AppMode
): ModeUnreadCount | null {
  if (!page || !Array.isArray(page.data)) return null
  const unread = page.data.filter((row) => row.read !== true)
  const total = page.pagination?.total ?? page.data.length
  return {
    value: filterNotificationsForMode(unread, mode).length,
    overflow: total > page.data.length,
  }
}

/** The badge text: "99+" past 99, "12+" when the count is a floor, else the number. */
export function formatUnreadBadge(count: ModeUnreadCount): string {
  if (count.value > 99) return '99+'
  return count.overflow ? `${count.value}+` : String(count.value)
}
