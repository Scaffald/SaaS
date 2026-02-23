import { useQuery } from '@tanstack/react-query'
import type {
  NotificationDelivery,
  DigestQueueItem,
  AdminListDeliveriesParams,
  AdminListDigestQueueParams,
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
