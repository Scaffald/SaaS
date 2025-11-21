import type { AddressResult, GeocodingProvider, ProviderConfig, SearchOptions } from '../types'
import { GeocodingError } from '../types'
import { MapboxProvider } from './mapbox'

/**
 * Factory functions for creating geocoding providers
 */

/**
 * Create a provider instance based on configuration
 */
export function createProvider(config: ProviderConfig): GeocodingProvider {
  switch (config.provider) {
    case 'mapbox':
      return new MapboxProvider(config)
    default:
      throw new GeocodingError(
        `Unsupported geocoding provider: ${config.provider}. Only 'mapbox' is supported.`,
        'UNSUPPORTED_PROVIDER',
        config.provider || 'unknown'
      )
  }
}

/**
 * Create provider from environment variables
 */
export function createFromEnvironment(): GeocodingProvider {
  const envProvider = process.env.GEOCODING_PROVIDER?.toLowerCase()
  const provider: 'mapbox' = envProvider === 'mapbox' ? 'mapbox' : 'mapbox'

  if (envProvider && envProvider !== 'mapbox') {
    console.warn(
      `Unsupported geocoding provider "${envProvider}" found in environment. Falling back to Mapbox.`
    )
  }

  const apiKey = getApiKeyFromEnvironment(provider)

  if (!apiKey) {
    throw new GeocodingError(
      `API key not found for ${provider} provider. Set EXPO_PUBLIC_MAPBOX_TOKEN`,
      'MISSING_API_KEY',
      provider
    )
  }

  const config: ProviderConfig = {
    provider,
    apiKey,
    defaultCountry: process.env.GEOCODING_DEFAULT_COUNTRY || 'US',
    language: process.env.GEOCODING_LANGUAGE || 'en',
  }

  return createProvider(config)
}

/**
 * Get API key from environment variables
 */
export function getApiKeyFromEnvironment(_provider: string): string {
  // Check provider-specific key first
  const providerKey = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  if (providerKey) return providerKey

  // Fallback to generic key
  const genericKey = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  if (genericKey) return genericKey

  return ''
}

/**
 * Validate provider configuration
 */
export function validateConfig(config: ProviderConfig): boolean {
  try {
    createProvider(config)
    return true
  } catch {
    return false
  }
}

/**
 * Get supported providers
 */
export function getSupportedProviders(): Array<'mapbox'> {
  return ['mapbox']
}

/**
 * Service class for managing geocoding providers with fallback support
 */
export class GeocodingService {
  private primaryProvider: GeocodingProvider
  private fallbackProvider?: GeocodingProvider

  constructor(primaryConfig: ProviderConfig, fallbackConfig?: ProviderConfig) {
    this.primaryProvider = createProvider(primaryConfig)

    if (fallbackConfig) {
      this.fallbackProvider = createProvider(fallbackConfig)
    }
  }

  /**
   * Search with automatic fallback
   */
  async search(query: string, options?: SearchOptions): Promise<AddressResult[]> {
    try {
      return await this.primaryProvider.search(query, options)
    } catch (error) {
      if (this.fallbackProvider) {
        console.warn('Primary provider failed, trying fallback:', error)
        try {
          return await this.fallbackProvider.search(query, options)
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
        }
      }
      throw error
    }
  }

  /**
   * Geocode with automatic fallback
   */
  async geocode(address: string, options?: SearchOptions): Promise<AddressResult | null> {
    try {
      return await this.primaryProvider.geocode(address, options)
    } catch (error) {
      if (this.fallbackProvider) {
        console.warn('Primary provider failed, trying fallback:', error)
        try {
          return await this.fallbackProvider.geocode(address, options)
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
        }
      }
      throw error
    }
  }

  /**
   * Reverse geocode with automatic fallback
   */
  async reverseGeocode(
    lat: number,
    lng: number,
    options?: SearchOptions
  ): Promise<AddressResult | null> {
    try {
      return await this.primaryProvider.reverseGeocode(lat, lng, options)
    } catch (error) {
      if (this.fallbackProvider) {
        console.warn('Primary provider failed, trying fallback:', error)
        try {
          return await this.fallbackProvider.reverseGeocode(lat, lng, options)
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
        }
      }
      throw error
    }
  }

  /**
   * Get the current primary provider
   */
  getPrimaryProvider(): GeocodingProvider {
    return this.primaryProvider
  }

  /**
   * Switch primary and fallback providers
   */
  switchProviders(): void {
    if (this.fallbackProvider) {
      const temp = this.primaryProvider
      this.primaryProvider = this.fallbackProvider
      this.fallbackProvider = temp
    }
  }
}
