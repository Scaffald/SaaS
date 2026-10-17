import { useStripePublicConfig } from '@scf/core/utils/stripe-settings-sdk-hooks'

export function useStripeConfig(enabled = true) {
  // The payer-facing config, not the office-only settings (#1258).
  const query = useStripePublicConfig({ enabled })

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
