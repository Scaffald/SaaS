import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import type {
  ExperienceEntry,
  ExperienceSummary,
  SaveExperienceParams,
  SaveExperienceResponse,
  DeleteExperienceParams,
  DeleteExperienceResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get user's experience entries
 */
export function useExperience(
  options?: Omit<UseQueryOptions<ExperienceEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'experience'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.experience.getExperience()
    },
    enabled: !!client && (options?.enabled !== false),
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
    queryKey: ['profiles', 'experience', 'summary'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.experience.getExperienceSummary()
    },
    enabled: !!client && (options?.enabled !== false),
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
