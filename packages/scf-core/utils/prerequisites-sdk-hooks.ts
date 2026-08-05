/**
 * Prerequisites SDK hooks. Use these instead of api.prerequisites.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 *
 * Note: the server implements exactly /check, /complete and /accept-legal —
 * hooks for the old speculative endpoints (list/validate/missing/stats) were
 * removed together with their SDK methods.
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import type {
  AcceptLegalParams,
  AcceptLegalResponse,
  CompletePrerequisitesParams,
  CompletePrerequisitesResponse,
  PrerequisitesCheckResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// ============================================================================
// QUERY HOOKS
// ============================================================================

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

/**
 * Accept the currently-published legal document versions (the /legal-update
 * re-acceptance screen). Callers should invalidate the ['prerequisites']
 * query-key PREFIX on success — that covers both this package's
 * ['prerequisites','check'] and @scaffald/sdk/react's ['prerequisites'].
 */
export function useAcceptLegalMutation(
  options?: UseMutationOptions<AcceptLegalResponse, Error, AcceptLegalParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: AcceptLegalParams) => {
      if (!client) throw new Error('Missing client')
      return client.prerequisites.acceptLegal(params)
    },
    ...options,
  })
}
