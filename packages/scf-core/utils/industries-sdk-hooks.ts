/**
 * Industries SDK hooks. Use these instead of api.industries.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { Industry, IndustryListResponse } from '@scaffald/sdk/resources/industries'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** List all industries */
export function useIndustries(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['industries', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.industries.list()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 60 * 60 * 1000, // 1 hour - industries rarely change
  })
}

/** Get a specific industry by slug */
export function useIndustry(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['industries', 'retrieve', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.industries.retrieve(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 60 * 60 * 1000, // 1 hour - industries rarely change
  })
}
