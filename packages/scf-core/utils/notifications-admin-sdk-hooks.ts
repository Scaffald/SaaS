import { useQuery } from '@tanstack/react-query'
import type {
  NotificationDelivery,
  DigestQueueItem,
  AdminListDeliveriesParams,
  AdminListDigestQueueParams,
  ListNotificationsParams,
  NotificationsListResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export function useNotificationDeliveries(
  params?: AdminListDeliveriesParams,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery<NotificationDelivery[], Error>({
    queryKey: ['notifications', 'admin', 'deliveries', params?.status, params?.limit],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.notificationsAdmin.listDeliveries(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30 * 1000,
  })
}

export function useNotificationDigestQueue(
  params?: AdminListDigestQueueParams,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery<DigestQueueItem[], Error>({
    queryKey: ['notifications', 'admin', 'digest-queue', params?.limit],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.notificationsAdmin.listDigestQueue(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30 * 1000,
  })
}

/**
 * The caller's operational notifications — failed cron runs and the like —
 * which the personal list leaves out (#1178). Office collapses them per job.
 *
 * `scope` is an `api` query parameter the SDK's `ListNotificationsParams` does
 * not declare yet; the resource passes params straight through to the query
 * string, so the cast is the whole gap until the SDK adds the field.
 */
export function useOperationalNotifications(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<NotificationsListResponse, Error>({
    queryKey: ['scaffald', 'notifications', 'list', 'operations'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.notifications.list({
        scope: 'operations',
        limit: 100,
      } as ListNotificationsParams)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}
