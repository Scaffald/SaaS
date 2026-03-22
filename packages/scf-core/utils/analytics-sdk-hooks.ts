/**
 * Analytics SDK Hooks
 * React Query hooks for dashboard analytics data
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  AnalyticsSummary,
  GetSummaryParams,
  GetEngagementTimelineParams,
  EngagementTimelineResponse,
  GetVisitorsParams,
  VisitorsResponse,
  GetVisibilityTimelineParams,
  VisibilityTimelineResponse,
  GetSearchKeywordsParams,
  SearchKeywordsResponse,
  GetSearchTimelineParams,
  SearchTimelineResponse,
  TrackImpressionParams,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get analytics summary with KPIs and sparklines
 */
export function useAnalyticsSummary(
  params?: GetSummaryParams,
  options?: Omit<UseQueryOptions<AnalyticsSummary>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'summary', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getSummary(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get engagement timeline for charts
 */
export function useEngagementTimeline(
  params?: GetEngagementTimelineParams,
  options?: Omit<UseQueryOptions<EngagementTimelineResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'engagement', 'timeline', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getEngagementTimeline(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get profile visitors with demographics
 */
export function useAnalyticsVisitors(
  params?: GetVisitorsParams,
  options?: Omit<UseQueryOptions<VisitorsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'engagement', 'visitors', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getVisitors(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Get visibility/impression timeline
 */
export function useVisibilityTimeline(
  params?: GetVisibilityTimelineParams,
  options?: Omit<UseQueryOptions<VisibilityTimelineResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'visibility', 'timeline', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getVisibilityTimeline(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Get top search keywords
 */
export function useSearchKeywords(
  params?: GetSearchKeywordsParams,
  options?: Omit<UseQueryOptions<SearchKeywordsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'search', 'keywords', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getSearchKeywords(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get search appearance timeline
 */
export function useSearchTimeline(
  params?: GetSearchTimelineParams,
  options?: Omit<UseQueryOptions<SearchTimelineResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['analytics', 'search', 'timeline', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.getSearchTimeline(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Track a search impression (server-side usage)
 */
export function useTrackImpressionMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, TrackImpressionParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: TrackImpressionParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.analytics.trackImpression(params)
    },
    ...options,
  })
}
