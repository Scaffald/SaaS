import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import type {
  CancelDeletionResponse,
  DeletionStatusResponse,
  RequestDeletionResponse,
  RequestWorkerDeletionParams,
  RequestOrganizationDeletionParams,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export const ACCOUNT_DELETION_STATUS_KEY = ['account-deletion', 'status'] as const

/**
 * The signed-in user's open deletion request, if any (#1313). A request waits
 * 14 days before it is carried out; during that time the user can sign back
 * in and cancel it.
 */
export function useAccountDeletionStatus(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<DeletionStatusResponse>({
    queryKey: ACCOUNT_DELETION_STATUS_KEY,
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.accountDeletion.getStatus()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCancelAccountDeletionMutation(
  options?: UseMutationOptions<CancelDeletionResponse, Error, void>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.accountDeletion.cancel()
    },
    ...options,
  })
}

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
  options?: UseMutationOptions<RequestDeletionResponse, Error, RequestOrganizationDeletionParams>
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
