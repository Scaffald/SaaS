import { useMemo } from 'react'
import { useNotifications } from '@scf/core/utils/notifications-sdk-hooks'
import { useAppMode } from '@scf/core/utils/useAppMode'
import { countUnreadForMode, formatUnreadBadge, UNREAD_PAGE_LIMIT } from './unread'

/**
 * Unread notifications the inbox in the current mode would show (#1250).
 *
 * Keyed under the notifications list, so the optimistic read-marking in
 * `useNotificationActions` and every list invalidation reach it without a
 * second cache entry to keep in step. Reads the shared mode store, so
 * switching mode recounts at once — no refetch needed.
 */
export function useModeUnreadCount(options?: { enabled?: boolean }) {
  const { mode } = useAppMode()
  const query = useNotifications(
    { read: false, limit: UNREAD_PAGE_LIMIT },
    { enabled: options?.enabled ?? true }
  )
  const count = useMemo(() => countUnreadForMode(query.data, mode), [query.data, mode])

  return {
    /** 0 until loaded; a badge hides at 0, so nothing is claimed early. */
    count: count?.value ?? 0,
    /** The badge text, e.g. "3", "12+", "99+". */
    label: count ? formatUnreadBadge(count) : '0',
  }
}
