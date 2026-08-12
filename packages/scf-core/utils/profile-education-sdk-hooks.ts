import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  EducationEntry,
  EducationLevel,
  SaveEducationParams,
  SaveEducationResponse,
  DeleteEducationParams,
  DeleteEducationResponse,
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
 * Get user's education entries
 */
export function useEducation(
  options?: Omit<UseQueryOptions<EducationEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: profileQueryKeys.education(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.education.getEducation()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get education level from profile
 */
export function useEducationLevel(
  options?: Omit<UseQueryOptions<EducationLevel, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: profileQueryKeys.educationLevel(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.education.getEducationLevel()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Save education entries (create/update bulk)
 */
export function useSaveEducationMutation(
  options?: UseMutationOptions<SaveEducationResponse, Error, SaveEducationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SaveEducationParams) => {
      if (!client) throw new Error('Missing client')
      return client.education.saveEducation(params)
    },
    ...options,
  })
}

interface SaveEducationContext {
  previousEducation?: EducationEntry[] | undefined
  previousLevel?: EducationLevel | undefined
}

/**
 * Save education mutation with optimistic updates and profile sync.
 */
export function useSaveEducationMutationWithSync(
  overrides?: UseMutationOptions<SaveEducationResponse, Error, SaveEducationParams>
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  // composeMutationOptions, not object spread: a caller passing its own
  // onSuccess used to *replace* the handler below rather than add to it (#586).
  return useSaveEducationMutation(
    composeMutationOptions(
      {
        async onMutate(input: SaveEducationParams): Promise<SaveEducationContext> {
          resetProfileSyncError()
          startProfileSync()
          await Promise.all([
            queryClient.cancelQueries({ queryKey: profileQueryKeys.education() }),
            queryClient.cancelQueries({ queryKey: profileQueryKeys.educationLevel() }),
          ])
          const previousEducation = queryClient.getQueryData<EducationEntry[]>(profileQueryKeys.education())
          const previousLevel = queryClient.getQueryData<EducationLevel>(profileQueryKeys.educationLevel())
          queryClient.setQueryData(profileQueryKeys.education(), (input.education_entries ?? []) as EducationEntry[])
          queryClient.setQueryData(profileQueryKeys.educationLevel(), {
            education_level: input.education_level ?? null,
          })
          return { previousEducation, previousLevel }
        },
        onError(error: Error, _variables: SaveEducationParams, _context: unknown) {
          const ctx = _context as SaveEducationContext | undefined
          if (ctx?.previousEducation) {
            queryClient.setQueryData(profileQueryKeys.education(), ctx.previousEducation)
          }
          if (ctx?.previousLevel) {
            queryClient.setQueryData(profileQueryKeys.educationLevel(), ctx.previousLevel)
          }
          failProfileSync()
          toast.show({
            title: 'Error',
            message: error.message || 'Failed to save education entry. Please try again.',
            variant: 'error',
          })
        },
        onSuccess() {
          toast.show({
            title: 'Education Saved',
            message: 'Your education history has been updated successfully!',
            variant: 'success',
          })
        },
        async onSettled(_data: SaveEducationResponse | undefined, error: unknown) {
          if (!error) completeProfileSync()
          await invalidateProfileQueries(queryClient)
        },
      },
      overrides
    )
  )
}

/**
 * Delete education entry
 */
export function useDeleteEducationMutation(
  options?: UseMutationOptions<DeleteEducationResponse, Error, DeleteEducationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeleteEducationParams) => {
      if (!client) throw new Error('Missing client')
      return client.education.deleteEducation(params)
    },
    ...options,
  })
}
