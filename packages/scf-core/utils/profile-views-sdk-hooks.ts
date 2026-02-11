/**
 * Profile Views SDK Hooks
 * React Query hooks for profile view tracking and analytics
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tantml:query'
import { useScaffaldClient } from '../hooks/use-scaffald-client'
import type {
  ViewAnalytics,
  RecordViewParams,
  RecordViewResponse,
  GetProfileViewsParams,
  GetProfileViewsResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get who viewed current user's profile
 */
export function useProfileViews(
  params?: GetProfileViewsParams,
  options?: Omit<UseQueryOptions<GetProfileViewsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'profile-views', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileViews.getProfileViews(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get aggregated view statistics
 */
export function useViewAnalytics(
  options?: Omit<UseQueryOptions<ViewAnalytics>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'profile-views', 'analytics'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileViews.getViewAnalytics()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Record a profile view (with deduplication)
 */
export function useRecordViewMutation(
  options?: UseMutationOptions<RecordViewResponse, Error, RecordViewParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: RecordViewParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileViews.recordView(params)
    },
    ...options,
  })
}
