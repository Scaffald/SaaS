/**
 * Moderation SDK hooks — reporting content and people, and blocking people.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 *
 * See #690: the app carries user-generated content, and both stores require
 * reporting content, reporting a person, and blocking a person.
 */

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  BlocksListResponse,
  ContentReport,
  CreateReportParams,
  ReportsListResponse,
  UserBlock,
} from '@scaffald/sdk/resources/moderation'

// ============================================================================
// QUERIES
// ============================================================================

/** Reports you have filed. Nobody else can see them, including the reported party. */
export function useMyReports(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery<ReportsListResponse>({
    queryKey: ['moderation', 'reports', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.moderation.listReports(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** People you have blocked. */
export function useBlockedUsers(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery<BlocksListResponse>({
    queryKey: ['moderation', 'blocks', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.moderation.listBlocks(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * File a report.
 *
 * A 409 means this person already has an open report on this subject. That is
 * the outcome they wanted, so callers should show it as done rather than as a
 * failure — `isAlreadyReported` below exists so a caller does not have to
 * pattern-match on status codes at the call site.
 */
export function useReportMutation(
  options?: UseMutationOptions<ContentReport, Error, CreateReportParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation<ContentReport, Error, CreateReportParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.moderation.report(params)
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] })
      options?.onSuccess?.(...args)
    },
  })
}

/** True when a report failed only because one is already open for this subject. */
export function isAlreadyReported(error: unknown): boolean {
  const status = (error as { statusCode?: number; status?: number } | null)?.statusCode
    ?? (error as { status?: number } | null)?.status
  return status === 409
}

/**
 * Block someone. Immediate, and symmetric — neither of you sees the other.
 *
 * Invalidates the feeds and threads a block changes, because the server
 * filters them; without this the blocked person's posts stay on screen until
 * something else happens to refetch, which reads as the block not working.
 */
export function useBlockUserMutation(
  options?: UseMutationOptions<UserBlock, Error, string>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation<UserBlock, Error, string>({
    mutationFn: async (userId) => {
      if (!client) throw new Error('Missing client')
      return client.moderation.blockUser(userId)
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'blocks'] })
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      options?.onSuccess?.(...args)
    },
  })
}

/** Unblock, restoring delivery both ways. */
export function useUnblockUserMutation(
  options?: UseMutationOptions<void, Error, string>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      if (!client) throw new Error('Missing client')
      return client.moderation.unblockUser(userId)
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'blocks'] })
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      options?.onSuccess?.(...args)
    },
  })
}
