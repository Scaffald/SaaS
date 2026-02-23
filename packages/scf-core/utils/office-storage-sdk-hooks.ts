/**
 * Office Storage SDK Hooks
 * Hooks for office storage analytics. Requires office/platform role.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { StorageAnalyticsResponse } from '@scaffald/sdk'

export type { StorageAnalyticsResponse } from '@scaffald/sdk'

/** Get storage analytics across all users */
export function useOfficeStorageAnalytics(options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery<StorageAnalyticsResponse>({
    queryKey: ['office', 'storage', 'analytics'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeStorage.getAnalytics()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 60_000,
  })
}
