import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  ExperienceEntry,
  ExperienceSummary,
  SaveExperienceParams,
  SaveExperienceResponse,
  DeleteExperienceParams,
  DeleteExperienceResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'
import { useToast } from '@scaffald/ui'
import { invalidateProfileQueries } from '@scf/core/features/profile/utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from '@scf/core/features/profile/utils/profile-sync-store'
import { profileQueryKeys } from '@scf/core/utils/profile-query-keys'
import { composeMutationOptions } from '@scf/core/utils/compose-mutation-options'

/**
 * Get user's experience entries
 */
export function useExperience(
  options?: Omit<UseQueryOptions<ExperienceEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: profileQueryKeys.experience(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.experience.getExperience()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get experience summary (career level)
 */
export function useExperienceSummary(
  options?: Omit<UseQueryOptions<ExperienceSummary, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: profileQueryKeys.experienceSummary(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.experience.getExperienceSummary()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Save experience entries (create/update bulk)
 */
export function useSaveExperienceMutation(
  options?: UseMutationOptions<SaveExperienceResponse, Error, SaveExperienceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SaveExperienceParams) => {
      if (!client) throw new Error('Missing client')
      return client.experience.saveExperience(params)
    },
    ...options,
  })
}

interface SaveExperienceContext {
  previousExperience?: ExperienceEntry[] | undefined
  previousSummary?: ExperienceSummary | undefined
}

/**
 * Save experience mutation with optimistic updates and profile sync.
 */
export function useSaveExperienceMutationWithSync(
  overrides?: UseMutationOptions<SaveExperienceResponse, Error, SaveExperienceParams>
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  // composeMutationOptions, not object spread: a caller passing its own
  // onSuccess used to *replace* the handler below rather than add to it (#586).
  return useSaveExperienceMutation(
    composeMutationOptions(
      {
        async onMutate(input: SaveExperienceParams): Promise<SaveExperienceContext> {
          resetProfileSyncError()
          startProfileSync()
          await Promise.all([
            queryClient.cancelQueries({ queryKey: profileQueryKeys.experience() }),
            queryClient.cancelQueries({ queryKey: profileQueryKeys.experienceSummary() }),
          ])
          const previousExperience = queryClient.getQueryData<ExperienceEntry[]>(profileQueryKeys.experience())
          const previousSummary = queryClient.getQueryData<ExperienceSummary>(profileQueryKeys.experienceSummary())
          queryClient.setQueryData(profileQueryKeys.experience(), input.experience_entries as ExperienceEntry[])
          queryClient.setQueryData(profileQueryKeys.experienceSummary(), {
            career_level: (input.career_level ?? null) as string | null,
          })
          return { previousExperience, previousSummary }
        },
        onError(error: Error, _variables: SaveExperienceParams, _context: unknown) {
          const ctx = _context as SaveExperienceContext | undefined
          if (ctx?.previousExperience) {
            queryClient.setQueryData(profileQueryKeys.experience(), ctx.previousExperience)
          }
          if (ctx?.previousSummary) {
            queryClient.setQueryData(profileQueryKeys.experienceSummary(), ctx.previousSummary)
          }
          failProfileSync()
          toast.show({
            title: 'Error',
            message: error.message || 'Failed to save experience. Please try again.',
            variant: 'error',
          })
        },
        onSuccess() {
          toast.show({
            title: 'Experience Saved',
            message: 'Your work experience has been updated successfully!',
            variant: 'success',
          })
        },
        async onSettled(_data: SaveExperienceResponse | undefined, error: unknown) {
          if (!error) completeProfileSync()
          await invalidateProfileQueries(queryClient)
        },
      },
      overrides
    )
  )
}

/**
 * Delete experience entry
 */
export function useDeleteExperienceMutation(
  options?: UseMutationOptions<DeleteExperienceResponse, Error, DeleteExperienceParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeleteExperienceParams) => {
      if (!client) throw new Error('Missing client')
      return client.experience.deleteExperience(params)
    },
    ...options,
  })
}
