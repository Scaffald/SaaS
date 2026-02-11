/**
 * Profile Completion SDK Hooks
 * React Query hooks for profile completion status, milestones, and nudges
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  DismissNudgeParams,
  DismissNudgeResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get profile completion status with weighted scoring and milestones
 */
export function useCompletionStatus() {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'profiles', 'completion', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileCompletion.getStatus()
    },
    enabled: !!client,
  })
}

/**
 * Get personalized benefits messaging based on incomplete sections
 */
export function usePersonalizedBenefits() {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'profiles', 'completion', 'benefits'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileCompletion.getPersonalizedBenefits()
    },
    enabled: !!client,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Dismiss a profile completion nudge
 */
export function useDismissNudgeMutation(
  options?: UseMutationOptions<DismissNudgeResponse, Error, DismissNudgeParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DismissNudgeParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileCompletion.dismissNudge(params)
    },
    ...options,
  })
}
