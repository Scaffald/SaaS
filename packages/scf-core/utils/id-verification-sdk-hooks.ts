import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  IdVerificationPricingItem,
  IdVerificationListItem,
  ListVerificationsParams,
  RequestVerificationParams,
  ConfirmVerificationParams,
  RevokeVerificationParams,
} from '@scaffald/sdk'

export function useIdVerificationPricing(options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['idVerification', 'pricing'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.getPricing()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  })
}

export function useCurrentIdVerification(
  workerUserId?: string,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['idVerification', 'current', workerUserId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.getCurrentVerification(workerUserId)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 60 * 1000,
  })
}

export function useIdVerificationRequest() {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: RequestVerificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.requestVerification(params)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['idVerification'] })
    },
  })
}

export function useIdVerificationConfirm() {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: ConfirmVerificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.confirmVerificationPayment(params)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['idVerification'] })
    },
  })
}

export function useIdVerificationList(params?: ListVerificationsParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['idVerification', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.listVerifications(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useIdVerificationRevoke() {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: RevokeVerificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.idVerification.revokeVerification(params)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['idVerification'] })
    },
  })
}

export type { IdVerificationPricingItem, IdVerificationListItem }
