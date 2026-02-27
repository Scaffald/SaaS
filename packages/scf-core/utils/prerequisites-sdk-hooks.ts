/**
 * Prerequisites SDK hooks. Use these instead of api.prerequisites.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions, type UseQueryResult } from '@tanstack/react-query'
import type { CompletePrerequisitesParams, CompletePrerequisitesResponse, PrerequisitesCheckResponse } from '@scaffald/sdk'
import type {
  ListPrerequisitesParams,
  ValidatePrerequisitesParams,
  GetMissingParams,
  GetStatsParams,
  PrerequisitesResponse,
  Prerequisite,
  PrerequisiteCheckResult,
  PrerequisiteValidationResult,
  CompletionStats,
} from '@scaffald/sdk/resources/prerequisites'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** List all prerequisites */
export function usePrerequisites(
  params?: ListPrerequisitesParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery<PrerequisitesResponse>({
    queryKey: ['prerequisites', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get prerequisite by ID */
export function usePrerequisite(
  id: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<{ data: Prerequisite }> {
  const client = useScaffaldJobsClient()
  return useQuery<{ data: Prerequisite }>({
    queryKey: ['prerequisites', 'get', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.prerequisites.getById(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Check overall prerequisites status for current user */
export function usePrerequisitesCheck(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<PrerequisitesCheckResponse>({
    queryKey: ['prerequisites', 'check'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.check()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute - onboarding status should be fresh
  })
}

/** Check specific prerequisite completion status */
export function usePrerequisiteCheck(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<{ data: PrerequisiteCheckResult }>({
    queryKey: ['prerequisites', 'check-prerequisite', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.prerequisites.checkPrerequisite(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

/** Validate prerequisites for context */
export function useValidatePrerequisites(
  params?: ValidatePrerequisitesParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery<{ data: PrerequisiteValidationResult }>({
    queryKey: ['prerequisites', 'validate', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.validate(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

/** Get missing prerequisites */
export function useMissingPrerequisites(
  params?: GetMissingParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery<PrerequisitesResponse>({
    queryKey: ['prerequisites', 'missing', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.getMissing(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

/** Get completion statistics */
export function usePrerequisitesStats(params?: GetStatsParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<{ data: CompletionStats }>({
    queryKey: ['prerequisites', 'stats', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.getCompletionStats(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Complete prerequisites (onboarding flow) */
export function useCompletePrerequisitesMutation(
  options?: UseMutationOptions<CompletePrerequisitesResponse, Error, CompletePrerequisitesParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CompletePrerequisitesParams) => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.complete(params)
    },
    ...options,
  })
}
