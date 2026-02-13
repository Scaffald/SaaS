import {
  useMutation,
  useQuery,
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
