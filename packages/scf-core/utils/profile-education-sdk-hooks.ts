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

/**
 * Get user's education entries
 */
export function useEducation(
  options?: Omit<UseQueryOptions<EducationEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'education'],
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
    queryKey: ['profiles', 'education', 'level'],
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

  return useSaveEducationMutation({
    async onMutate(input: SaveEducationParams): Promise<SaveEducationContext> {
      resetProfileSyncError()
      startProfileSync()
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['profiles', 'education'] }),
        queryClient.cancelQueries({ queryKey: ['profiles', 'education', 'level'] }),
      ])
      const previousEducation = queryClient.getQueryData<EducationEntry[]>(['profiles', 'education'])
      const previousLevel = queryClient.getQueryData<EducationLevel>(['profiles', 'education', 'level'])
      queryClient.setQueryData(['profiles', 'education'], (input.education_entries ?? []) as EducationEntry[])
      queryClient.setQueryData(['profiles', 'education', 'level'], {
        education_level: input.education_level ?? null,
      })
      return { previousEducation, previousLevel }
    },
    onError(error: Error, _variables: SaveEducationParams, _context: unknown) {
      const ctx = _context as SaveEducationContext | undefined
      if (ctx?.previousEducation) {
        queryClient.setQueryData(['profiles', 'education'], ctx.previousEducation)
      }
      if (ctx?.previousLevel) {
        queryClient.setQueryData(['profiles', 'education', 'level'], ctx.previousLevel)
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
    ...overrides,
  })
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
