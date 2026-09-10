/**
 * Profile Completion SDK Hooks
 * React Query hooks for profile completion status, milestones, and nudges
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

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

// useDismissNudgeMutation used to be here. No component ever imported it, and
// the endpoint it called wrote to a table that does not exist. Retired with the
// route (#658).
