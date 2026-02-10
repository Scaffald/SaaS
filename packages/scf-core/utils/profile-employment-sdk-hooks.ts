import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import type {
  EmploymentPreferences,
  UpdateEmploymentParams,
  UpdateEmploymentResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get employment preferences
 */
export function useEmployment(
  options?: Omit<UseQueryOptions<EmploymentPreferences, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'employment'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.employment.getEmployment()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Update employment preferences
 */
export function useUpdateEmploymentMutation(
  options?: UseMutationOptions<UpdateEmploymentResponse, Error, UpdateEmploymentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateEmploymentParams) => {
      if (!client) throw new Error('Missing client')
      return client.employment.updateEmployment(params)
    },
    ...options,
  })
}
