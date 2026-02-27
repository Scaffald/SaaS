import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  SuccessFeeStatus,
  CreateSuccessFeeParams,
  CreateSuccessFeeResponse,
  GetStatusByApplicationParams,
  ConfirmUpfrontPaymentParams,
} from '@scaffald/sdk'

const KEY = ['successFees'] as const

export function useSuccessFeeStatus(
  params: GetStatusByApplicationParams,
  options?: { enabled?: boolean; staleTime?: number },
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...KEY, 'status', params.organizationId, params.applicationId, params.workerUserId],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.successFees.getStatus(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 10_000,
  })
}

export function useCreateSuccessFeeMutation(
  options?: UseMutationOptions<CreateSuccessFeeResponse, Error, CreateSuccessFeeParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateSuccessFeeParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.successFees.create(params)
    },
    ...options,
  })
}

export function useConfirmUpfrontPaymentMutation(
  options?: UseMutationOptions<{ ok: true }, Error, ConfirmUpfrontPaymentParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: ConfirmUpfrontPaymentParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.successFees.confirmUpfront(params)
    },
    ...options,
  })
}

// Re-export types for convenience
export type { SuccessFeeStatus, CreateSuccessFeeResponse, GetStatusByApplicationParams, ConfirmUpfrontPaymentParams }
