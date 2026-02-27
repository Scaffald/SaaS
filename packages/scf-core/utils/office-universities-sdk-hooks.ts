/**
 * Office Universities SDK hooks. Manages university catalog.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  University,
  UniversityListParams,
  UniversitySearchParams,
  CreateUniversityParams,
  UpdateUniversityParams,
} from '@scaffald/sdk'

export function useOfficeUniversity(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'university', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.officeUniversities.retrieve(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOfficeUniversities(
  params?: UniversityListParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'universities', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeUniversities.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

export function useSearchUniversities(
  params: UniversitySearchParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['universities', 'search', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeUniversities.search(params)
    },
    enabled: !!client && !!params.query && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useCreateUniversityMutation(
  options?: UseMutationOptions<{ success: boolean; university: University }, Error, CreateUniversityParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean; university: University }, Error, CreateUniversityParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.officeUniversities.create(params)
    },
    ...options,
  })
}

export function useUpdateUniversityMutation(
  options?: UseMutationOptions<{ success: boolean; university: University }, Error, { id: string; params: UpdateUniversityParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean; university: University }, Error, { id: string; params: UpdateUniversityParams }>({
    mutationFn: async ({ id, params }) => {
      if (!client) throw new Error('Missing client')
      return client.officeUniversities.update(id, params)
    },
    ...options,
  })
}

export function useDeleteUniversityMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      if (!client) throw new Error('Missing client')
      return client.officeUniversities.delete(id)
    },
    ...options,
  })
}
