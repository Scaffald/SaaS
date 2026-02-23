/**
 * Workers SDK Hooks
 * React hooks for worker discovery and profile viewing
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { GetWorkersParams } from '@scaffald/sdk/resources/workers'

/**
 * Get all workers with optional filtering
 * Public endpoint for worker discovery
 */
export function useWorkers(
  params?: GetWorkersParams,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['workers', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.workers.getWorkers(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  })
}

/**
 * Get a single worker profile by ID
 */
export function useWorker(workerId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['workers', 'detail', workerId],
    queryFn: async () => {
      if (!client || !workerId) throw new Error('Missing Scaffald client or workerId')
      return client.workers.getWorkerById({ id: workerId })
    },
    enabled: !!client && !!workerId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
