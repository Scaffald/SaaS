/**
 * useNotifications Hook
 * 
 * Provides convenient hooks for fetching and mutating notifications
 * Uses the Edge Function notifications router via proxy
 */

import { useCallback } from 'react'
import { trpc } from '../lib/trpc'

export type NotificationStatus = 'all' | 'unread' | 'read' | 'archived'

export interface UseNotificationsOptions {
  status?: NotificationStatus
  limit?: number
  enabled?: boolean
}

/**
 * Hook for managing notifications
 * 
 * Provides:
 * - List of notifications with filtering
 * - Unread count
 * - Mutations for marking as read/unread, archiving, deleting
 * - Auto-refresh on mutations
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { status = 'all', limit = 25, enabled = true } = options

  // Fetch notifications list
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = trpc.notifications.list.useQuery(
    { status, limit },
    { enabled }
  )

  // Fetch unread count
  const { data: unreadCountData, refetch: refetchUnreadCount } =
    trpc.notifications.getUnreadCount.useQuery(undefined, { enabled })

  const utils = trpc.useUtils()

  // Helper to invalidate and refetch all notification queries
  const invalidateNotifications = useCallback(() => {
    utils.notifications.list.invalidate()
    utils.notifications.getUnreadCount.invalidate()
  }, [utils])

  // Mark single notification as read
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Mark single notification as unread
  const markAsUnreadMutation = trpc.notifications.markAsUnread.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Mark many notifications as read
  const markManyReadMutation = trpc.notifications.markManyRead.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Mark many notifications as unread
  const markManyUnreadMutation = trpc.notifications.markManyUnread.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Archive many notifications
  const archiveManyMutation = trpc.notifications.archiveMany.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Restore many notifications from archive
  const restoreManyMutation = trpc.notifications.restoreMany.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Mark all as read
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: invalidateNotifications,
  })

  // Soft delete many notifications
  const deleteManyMutation = trpc.notifications.deleteMany.useMutation({
    onSuccess: invalidateNotifications,
  })

  return {
    // Data
    notifications: notificationsData?.items ?? [],
    nextCursor: notificationsData?.nextCursor ?? null,
    unreadCount: unreadCountData?.count ?? 0,
    isLoading,
    error,

    // Mutations
    markAsRead: markAsReadMutation.mutateAsync,
    markAsUnread: markAsUnreadMutation.mutateAsync,
    markManyRead: markManyReadMutation.mutateAsync,
    markManyUnread: markManyUnreadMutation.mutateAsync,
    archiveMany: archiveManyMutation.mutateAsync,
    restoreMany: restoreManyMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteMany: deleteManyMutation.mutateAsync,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,
    isMarkingManyRead: markManyReadMutation.isPending,
    isMarkingManyUnread: markManyUnreadMutation.isPending,
    isArchiving: archiveManyMutation.isPending,
    isRestoring: restoreManyMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteManyMutation.isPending,

    // Manual refresh
    refetch,
    refetchUnreadCount,
    invalidateNotifications,
  }
}
