import { useStripeSettings } from '@scf/core/utils/stripe-settings-sdk-hooks'

export function useStripeConfig(enabled = true) {
  const query = useStripeSettings({ enabled })

  return {
    publishableKey: query.data?.publishableKey ?? null,
    mode: query.data ? (query.data.testMode ? 'test' : 'live') : 'test',
    testMode: query.data?.testMode ?? true,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
