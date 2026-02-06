/**
 * Fetch job by slug via Scaffald SDK (REST API).
 * Requires ScaffaldJobsSdkProviderFromSession.
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

/**
 * Fetches a job by slug using the SDK (REST GET /v1/jobs/slug/:slug).
 */
export function useJobBySlug(slug: string | undefined, options?: { enabled?: boolean }) {
  const sdkClient = useScaffaldJobsClient()
  const sdkQuery = useQuery({
    queryKey: ['job', 'slug', slug],
    queryFn: async () => {
      if (!sdkClient || slug === undefined) throw new Error('Missing client or slug')
      return sdkClient.jobs.retrieveBySlug(slug)
    },
    enabled: !!slug && !!sdkClient && (options?.enabled !== false),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return {
    data: sdkQuery.data ?? null,
    isLoading: sdkQuery.isLoading,
    error: sdkQuery.error as Error | null,
    refetch: () => sdkQuery.refetch(),
  }
}
