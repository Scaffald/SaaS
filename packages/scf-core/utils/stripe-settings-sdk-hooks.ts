import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  StripeSettings,
  UpdatePublishableKeyParams,
  UpdateTestModeParams,
  UpdateStripeApiKeyParams,
  UpdateWebhookSecretParams,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

const SETTINGS_QUERY_KEY = ['stripe-settings']

export function useStripeSettings(
  options?: Omit<UseQueryOptions<StripeSettings, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery<StripeSettings, Error>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.getSettings()
    },
    enabled: !!client,
    staleTime: 30 * 1000,
    ...options,
  })
}

export function useUpdatePublishableKeyMutation(
  options?: UseMutationOptions<{ publishableKey: string }, Error, UpdatePublishableKeyParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdatePublishableKeyParams) => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.updatePublishableKey(params)
    },
    ...options,
  })
}

export function useUpdateTestModeMutation(
  options?: UseMutationOptions<{ testMode: boolean }, Error, UpdateTestModeParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateTestModeParams) => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.updateTestMode(params)
    },
    ...options,
  })
}

export function useUpdateApiKeyMutation(
  options?: UseMutationOptions<{ hasApiKey: boolean }, Error, UpdateStripeApiKeyParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateStripeApiKeyParams) => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.updateApiKey(params)
    },
    ...options,
  })
}

export function useUpdateWebhookSecretMutation(
  options?: UseMutationOptions<{ hasWebhookSecret: boolean }, Error, UpdateWebhookSecretParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateWebhookSecretParams) => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.updateWebhookSecret(params)
    },
    ...options,
  })
}

export function useTestConnectionMutation(
  options?: UseMutationOptions<{ ok: true }, Error, void>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.stripeSettings.testConnection()
    },
    ...options,
  })
}
