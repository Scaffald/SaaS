import { api } from '@scf/core/utils/api'

export function useStripeConfig(enabled = true) {
  const query = api.payments.getStripeConfig.useQuery(undefined, {
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  return {
    publishableKey: query.data?.publishableKey ?? null,
    mode: query.data?.mode ?? 'test',
    testMode: query.data?.testMode ?? true,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
