import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from '@tanstack/react-query'
import type {
  StoragePreferenceResponse,
  SetStoragePreferenceParams,
  SetStoragePreferenceResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export const STORAGE_PREFERENCE_QUERY_KEY = ['documents', 'storage-preference']

export function useStoragePreference(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<StoragePreferenceResponse, Error>({
    queryKey: STORAGE_PREFERENCE_QUERY_KEY,
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.documentsStorage.getStoragePreference()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSetStoragePreferenceMutation(
  options?: UseMutationOptions<
    SetStoragePreferenceResponse,
    Error,
    SetStoragePreferenceParams
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SetStoragePreferenceParams) => {
      if (!client) throw new Error('Missing client')
      return client.documentsStorage.setStoragePreference(params)
    },
    ...options,
  })
}
