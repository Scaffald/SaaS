/**
 * Notifications SDK Hooks
 * React Query hooks for notifications and preferences
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
  NotificationsListResponse,
  UnreadCountResponse,
  NotificationResponse,
  MarkAllAsReadResponse,
  PreferencesResponse,
  UpdatePreferencesParams,
} from '@scaffald/sdk'

// ============================================================================
// Local types for functionality not yet in the SDK
// ============================================================================

interface SuccessResponse {
  success: boolean
}

interface BulkIdsParams {
  ids: string[]
}

interface NotificationDevice {
  id: string
  token: string
  platform: 'ios' | 'android' | 'web'
  metadata?: Record<string, unknown>
}

interface RegisterDeviceParams {
  token: string
  platform: 'ios' | 'android' | 'web'
  metadata?: Record<string, unknown>
}

interface RemoveDeviceParams {
  token: string
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List notifications with filtering and pagination
 */
export function useNotifications(
  params?: ListNotificationsParams,
  options?: Omit<UseQueryOptions<NotificationsListResponse>, 'queryKey' | 'queryFn'>
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
  params?: ListNotificationsParams,
  options?: Omit<
    UseInfiniteQueryOptions<NotificationsListResponse>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  const client = useScaffaldJobsClient()

  return useInfiniteQuery({
    queryKey: ['scaffald', 'notifications', 'list-infinite', params],
    queryFn: async ({ pageParam }) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.list({ ...params, page: pageParam as number | undefined })
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination
      return page < total_pages ? page + 1 : undefined
    },
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
 * NOTE: Device management is not yet supported by the SDK.
 */
export function useNotificationDevices(
  options?: Omit<UseQueryOptions<NotificationDevice[]>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'notifications', 'devices'],
    queryFn: async (): Promise<NotificationDevice[]> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Device management is not yet supported by the notifications SDK')
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
  options?: UseMutationOptions<NotificationResponse, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markAsRead(id)
    },
    ...options,
  })
}

/**
 * Mark a notification as unread
 */
export function useMarkAsUnreadMutation(
  options?: UseMutationOptions<NotificationResponse, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.markAsUnread(id)
    },
    ...options,
  })
}

/**
 * Mark multiple notifications as read
 * NOTE: Bulk operations are not yet supported by the SDK.
 */
export function useMarkManyReadMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: BulkIdsParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Bulk mark-as-read is not yet supported by the notifications SDK')
    },
    ...options,
  })
}

/**
 * Mark multiple notifications as unread
 * NOTE: Bulk operations are not yet supported by the SDK.
 */
export function useMarkManyUnreadMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: BulkIdsParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Bulk mark-as-unread is not yet supported by the notifications SDK')
    },
    ...options,
  })
}

/**
 * Archive multiple notifications
 * NOTE: Archive operations are not yet supported by the SDK.
 */
export function useArchiveManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: BulkIdsParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Archive is not yet supported by the notifications SDK')
    },
    ...options,
  })
}

/**
 * Restore multiple notifications from archive
 * NOTE: Restore operations are not yet supported by the SDK.
 */
export function useRestoreManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: BulkIdsParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Restore is not yet supported by the notifications SDK')
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
 * Delete multiple notifications
 * NOTE: Bulk delete is not yet supported by the SDK.
 */
export function useDeleteManyMutation(
  options?: UseMutationOptions<SuccessResponse, Error, BulkIdsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: BulkIdsParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Bulk delete is not yet supported by the notifications SDK')
    },
    ...options,
  })
}

/**
 * Save notification preferences
 * NOTE: Uses SDK's updatePreferences under the hood.
 */
export function useSavePreferencesMutation(
  options?: UseMutationOptions<PreferencesResponse, Error, UpdatePreferencesParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdatePreferencesParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.updatePreferences(params)
    },
    ...options,
  })
}

/**
 * Update notification preferences
 */
export function useUpdatePreferencesMutation(
  options?: UseMutationOptions<PreferencesResponse, Error, UpdatePreferencesParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdatePreferencesParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.notifications.updatePreferences(params)
    },
    ...options,
  })
}

/**
 * Register a device for push notifications
 * NOTE: Device management is not yet supported by the SDK.
 */
export function useRegisterDeviceMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RegisterDeviceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: RegisterDeviceParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Device registration is not yet supported by the notifications SDK')
    },
    ...options,
  })
}

/**
 * Remove a registered device
 * NOTE: Device management is not yet supported by the SDK.
 */
export function useRemoveDeviceMutation(
  options?: UseMutationOptions<SuccessResponse, Error, RemoveDeviceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (_params: RemoveDeviceParams): Promise<SuccessResponse> => {
      if (!client) throw new Error('Scaffald client not available')
      throw new Error('Device removal is not yet supported by the notifications SDK')
    },
    ...options,
  })
}
