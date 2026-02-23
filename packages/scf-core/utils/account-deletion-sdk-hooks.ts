import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import type {
  RequestDeletionResponse,
  RequestWorkerDeletionParams,
  RequestOrganizationDeletionParams,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export function useRequestWorkerDeletionMutation(
  options?: UseMutationOptions<
    RequestDeletionResponse,
    Error,
    RequestWorkerDeletionParams | undefined
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params?: RequestWorkerDeletionParams) => {
      if (!client) throw new Error('Missing client')
      return client.accountDeletion.requestWorkerDeletion(params)
    },
    ...options,
  })
}

export function useRequestOrganizationDeletionMutation(
  options?: UseMutationOptions<
    RequestDeletionResponse,
    Error,
    RequestOrganizationDeletionParams
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RequestOrganizationDeletionParams) => {
      if (!client) throw new Error('Missing client')
      return client.accountDeletion.requestOrganizationDeletion(params)
    },
    ...options,
  })
}
