import { useMemo } from 'react'
import { createFromEnvironment, createProvider } from '../providers'
import type { ProviderConfig, UseGeocodingProviderReturn } from '../types'

/**
 * Hook to create and manage a geocoding provider instance
 *
 * @param config - Provider configuration
 * @returns Provider instance, ready state, and error
 */
export function useGeocodingProvider(config: ProviderConfig): UseGeocodingProviderReturn {
  const provider = useMemo(() => {
    try {
      return createProvider(config)
    } catch (error) {
      console.error('Failed to create geocoding provider:', error)
      return null
    }
    // Use JSON.stringify for deep comparison of config object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)])

  return {
    provider: provider || null,
    isReady: provider !== null,
    error: provider === null ? 'Failed to initialize geocoding provider' : null,
  }
}

/**
 * Hook to create a provider with environment-based configuration
 *
 * @returns Provider instance, ready state, and error
 */
export function useGeocodingProviderFromEnv(): UseGeocodingProviderReturn {
  const provider = useMemo(() => {
    try {
      return createFromEnvironment()
    } catch (error) {
      console.error('Failed to create geocoding provider from environment:', error)
      return null
    }
  }, [])

  return {
    provider: provider || null,
    isReady: provider !== null,
    error: provider === null ? 'Failed to initialize geocoding provider from environment' : null,
  }
}
