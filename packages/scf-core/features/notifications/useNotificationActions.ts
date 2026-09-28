/**
 * Opening a notification and marking everything read, shared by the
 * notifications centre and the drawer feed.
 *
 * Both write the read state into the cached list rows and the unread count
 * before the request lands, so the row's dot and the masthead badge change on
 * the tap rather than one round trip later. Settling refetches both, which
 * also restores the truth if the request failed.
 */
import { useCallback } from 'react'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import type { NotificationsListResponse, UnreadCountResponse } from '@scaffald/sdk'
import {
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import type { NotificationListItem } from './normalize'

const LIST_KEY = ['scaffald', 'notifications', 'list'] as const
const LIST_INFINITE_KEY = ['scaffald', 'notifications', 'list-infinite'] as const
const UNREAD_COUNT_KEY = ['scaffald', 'notifications', 'unread-count'] as const

function markCachedRowsRead(queryClient: QueryClient, matches: (id: string) => boolean) {
  queryClient.setQueriesData<NotificationsListResponse>({ queryKey: LIST_KEY }, (old) =>
    old?.data
      ? { ...old, data: old.data.map((n) => (matches(String(n.id)) ? { ...n, read: true } : n)) }
      : old
  )
}

function setCachedUnreadCount(queryClient: QueryClient, next: (count: number) => number) {
  queryClient.setQueryData<UnreadCountResponse>(UNREAD_COUNT_KEY, (old) =>
    old ? { ...old, data: { ...old.data, unread_count: next(old.data.unread_count) } } : old
  )
}

async function refetchNotifications(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: LIST_KEY }),
    queryClient.invalidateQueries({ queryKey: LIST_INFINITE_KEY }),
    queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY }),
  ])
}

/**
 * Returns a handler for a row press. Only rows with a `ctaUrl` are pressable,
 * so the handler navigates unconditionally and marks the row read on the way.
 */
export function useOpenNotification(onNavigate?: () => void) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutate: markRead } = useMarkAsReadMutation({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY })
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })
      markCachedRowsRead(queryClient, (rowId) => rowId === id)
      setCachedUnreadCount(queryClient, (count) => Math.max(0, count - 1))
    },
    onSettled: () => refetchNotifications(queryClient),
  })

  return useCallback(
    (item: NotificationListItem) => {
      if (!item.ctaUrl) return
      if (!item.read) markRead(item.id)
      router.push(item.ctaUrl as Href)
      onNavigate?.()
    },
    [markRead, onNavigate, router]
  )
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMarkAllAsReadMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY })
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })
      markCachedRowsRead(queryClient, () => true)
      setCachedUnreadCount(queryClient, () => 0)
    },
    onSettled: () => refetchNotifications(queryClient),
  })
}
