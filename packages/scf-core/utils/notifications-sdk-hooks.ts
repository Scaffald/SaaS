/**
 * Notifications SDK Hooks
 * React Query hooks for notifications, preferences, and device management
 */

import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  UnreadCountResponse,
  Notification,
  MarkAsReadParams,
  MarkAsUnreadParams,
  BulkIdsParams,
  SuccessResponse,
  MarkAllAsReadResponse,
  NotificationPreferences,
  PreferencesResponse,
  SavePreferencesParams,
  NotificationDevice,
  RegisterDeviceParams,
  RemoveDeviceParams,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List notifications with filtering and pagination
 */
export function useNotifications(
  params?: ListNotificationsParams,
  options?: Omit<UseQueryOptions<ListNotificationsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'notifications', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * List notifications with infinite scroll pagination
 */
export function useInfiniteNotifications(
  params?: Omit<ListNotificationsParams, 'cursor'>,
  options?: Omit<
    UseInfiniteQueryOptions<ListNotificationsResponse>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  const client = useScaffaldJobsClient()

  return useInfiniteQuery({
    queryKey: ['scaffald', 'notifications', 'list-infinite', params],
    queryFn: async ({ pageParam }) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.list({ ...params, cursor: pageParam as string | undefined })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get count of unread notifications
 */
export function useUnreadCount(
  options?: Omit<UseQueryOptions<UnreadCountResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'notifications', 'unread-count'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.getUnreadCount()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences(
  options?: Omit<UseQueryOptions<PreferencesResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'notifications', 'preferences'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.getPreferences()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * List registered notification devices
 */
export function useNotificationDevices(
  options?: Omit<UseQueryOptions<NotificationDevice[]>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'notifications', 'devices'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.listDevices()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Mark a notification as read
 */
export function useMarkAsReadMutation(
  options?: UseMutationOptions<Notification, Error, MarkAsReadParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: MarkAsReadParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markAsRead(params)
    },
    ...options,
  })
}

/**
 * Mark a notification as unread
 */
export function useMarkAsUnreadMutation(
  options?: UseMutationOptions<Notification, Error, MarkAsUnreadParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: MarkAsUnreadParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markAsUnread(params)
    },
    ...options,
  })
}

/**
 * Mark multiple notifications as read
 */
export function useMarkManyReadMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: BulkIdsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markManyRead(params)
    },
    ...options,
  })
}

/**
 * Mark multiple notifications as unread
 */
export function useMarkManyUnreadMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: BulkIdsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markManyUnread(params)
    },
    ...options,
  })
}

/**
 * Archive multiple notifications
 */
export function useArchiveManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: BulkIdsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.archiveMany(params)
    },
    ...options,
  })
}

/**
 * Restore multiple notifications from archive
 */
export function useRestoreManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: BulkIdsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.restoreMany(params)
    },
    ...options,
  })
}

/**
 * Mark all unread notifications as read
 */
export function useMarkAllAsReadMutation(
  options?: UseMutationOptions<MarkAllAsReadResponse, Error, void>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markAllAsRead()
    },
    ...options,
  })
}

/**
 * Delete multiple notifications (soft delete)
 */
export function useDeleteManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: BulkIdsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.deleteMany(params)
    },
    ...options,
  })
}

/**
 * Save notification preferences
 */
export function useSavePreferencesMutation(
  options?: UseMutationOptions<SuccessResponse, Error, SavePreferencesParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SavePreferencesParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.savePreferences(params)
    },
    ...options,
  })
}

/**
 * Register a device for push notifications
 */
export function useRegisterDeviceMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RegisterDeviceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: RegisterDeviceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.registerDevice(params)
    },
    ...options,
  })
}

/**
 * Remove a registered device
 */
export function useRemoveDeviceMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RemoveDeviceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: RemoveDeviceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.removeDevice(params)
    },
    ...options,
  })
}
