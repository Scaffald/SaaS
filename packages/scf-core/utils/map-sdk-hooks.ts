import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { GetLocationCountsParams, FindNearestResultsParams } from '@scaffald/sdk'

/**
 * Get result counts for a location (workers, jobs, employers)
 * Used to display counts in search suggestions
 */
export function useLocationCounts(
  params: GetLocationCountsParams | null,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['map', 'location-counts', params],
    queryFn: async () => {
      if (!client || !params) throw new Error('Missing client or params')
      return client.map.getLocationCounts(params)
    },
    enabled: !!client && !!params && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Find nearest location with results from a given search location
 * Used for no-results scenarios to suggest nearby locations
 */
export function useFindNearestResults(
  params: FindNearestResultsParams | null,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['map', 'find-nearest', params],
    queryFn: async () => {
      if (!client || !params) throw new Error('Missing client or params')
      return client.map.findNearestResults(params)
    },
    enabled: !!client && !!params && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}
