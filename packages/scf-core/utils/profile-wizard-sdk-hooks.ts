/**
 * Profile Wizard SDK Hooks
 * Hooks for managing profile wizard progress.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  ProfileWizardProgress,
  ProfileWizardSaveStepParams,
} from '@scaffald/sdk'

export const PROFILE_WIZARD_QUERY_KEY = ['profile-wizard', 'progress'] as const

export type { ProfileWizardProgress, ProfileWizardSaveStepParams } from '@scaffald/sdk'

/** Get the current user's profile wizard progress */
export function useProfileWizardProgress(options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery<ProfileWizardProgress>({
    queryKey: PROFILE_WIZARD_QUERY_KEY,
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWizard.getProgress()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 60_000,
  })
}

/** Save a wizard step */
export function useSaveProfileWizardStepMutation() {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation<ProfileWizardProgress, Error, ProfileWizardSaveStepParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.profileWizard.saveStep(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_WIZARD_QUERY_KEY })
    },
  })
}

/** Complete the profile wizard */
export function useCompleteProfileWizardMutation() {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation<ProfileWizardProgress, Error, { celebrate?: boolean } | undefined>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.profileWizard.complete(params ?? undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_WIZARD_QUERY_KEY })
    },
  })
}
