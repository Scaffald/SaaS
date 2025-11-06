import type { AddressResult, GeocodingProvider, ProviderConfig, SearchOptions } from '../types'
import { GeocodingError } from '../types'

/**
 * Base abstract class for geocoding providers
 * Provides common functionality and error handling
 */
export abstract class BaseGeocodingProvider implements GeocodingProvider {
  protected config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
    this.validateConfig(config)
  }

  /**
   * Validate provider configuration
   */
  protected validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new GeocodingError('API key is required', 'MISSING_API_KEY', config.provider)
    }
  }

  /**
   * Handle API errors consistently across providers
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof GeocodingError) {
      throw error
    }

    // Type guard for error objects
    const isErrorWithProperties = (
      err: unknown
    ): err is {
      name?: string
      code?: string
      status?: number
      message?: string
    } => {
      return typeof err === 'object' && err !== null
    }

    if (!isErrorWithProperties(error)) {
      throw new GeocodingError(
        `${context} failed: Unknown error`,
        'UNKNOWN_ERROR',
        this.config.provider,
        error
      )
    }

    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      throw new GeocodingError(
        'Network error occurred while fetching address data',
        'NETWORK_ERROR',
        this.config.provider,
        error
      )
    }

    // Rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      throw new GeocodingError(
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        this.config.provider,
        error
      )
    }

    // API key errors
    if (error.status === 401 || error.status === 403) {
      throw new GeocodingError(
        'Invalid API key or insufficient permissions',
        'INVALID_API_KEY',
        this.config.provider,
        error
      )
    }

    // Quota errors
    if (error.status === 402 || error.message?.includes('quota')) {
      throw new GeocodingError('API quota exceeded', 'QUOTA_EXCEEDED', this.config.provider, error)
    }

    // Generic error
    throw new GeocodingError(
      `${context} failed: ${error.message || 'Unknown error'}`,
      'API_ERROR',
      this.config.provider,
      error
    )
  }

  /**
   * Make HTTP request with error handling
   */
  protected async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        // Create error object with status code for proper error handling
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
          status?: number
          code?: string
        }
        error.status = response.status
        error.code = `HTTP_${response.status}`

        // Handle rate limiting
        if (response.status === 429) {
          error.code = 'RATE_LIMIT_EXCEEDED'
        }

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          error.code = 'INVALID_API_KEY'
        }

        throw error
      }

      return response
    } catch (error) {
      // Check if it's a network error (fetch failure)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error occurred') as Error & {
          name?: string
          code?: string
        }
        networkError.name = 'NetworkError'
        networkError.code = 'NETWORK_ERROR'
        throw networkError
      }

      this.handleError(error, 'API request')
    }
  }

  /**
   * Apply zoom level filtering to results
   */
  protected filterByZoomLevel(results: AddressResult[], zoomLevel?: string): AddressResult[] {
    if (!zoomLevel) return results

    return results.filter((result) => {
      switch (zoomLevel) {
        case 'street':
          return result.types.some((type) =>
            ['street_address', 'route', 'address', 'poi'].includes(type)
          )
        case 'city':
          return result.types.some((type) =>
            ['locality', 'sublocality', 'administrative_area_level_3', 'place'].includes(type)
          )
        case 'region':
          return result.types.some((type) =>
            ['administrative_area_level_1', 'administrative_area_level_2', 'country'].includes(type)
          )
        default:
          return true
      }
    })
  }

  // Abstract methods to be implemented by providers
  abstract search(query: string, options?: SearchOptions): Promise<AddressResult[]>
  abstract geocode(address: string, options?: SearchOptions): Promise<AddressResult | null>
  abstract reverseGeocode(
    lat: number,
    lng: number,
    options?: SearchOptions
  ): Promise<AddressResult | null>
}

/**
 * Common utilities for address parsing
 */

/**
 * Extract state abbreviation from full state name
 */
export function getStateAbbreviation(stateName: string): string {
  const stateMap: Record<string, string> = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  }

  // Return abbreviation if full name matches
  const abbrev = stateMap[stateName]
  if (abbrev) return abbrev

  // If already an abbreviation, return as is
  if (stateName.length === 2 && /^[A-Z]{2}$/.test(stateName)) {
    return stateName
  }

  // Fallback: return first 2 characters uppercased
  return stateName.substring(0, 2).toUpperCase()
}

/**
 * Clean and normalize address component
 */
export function normalizeComponent(value: unknown): string {
  if (!value) return ''
  return String(value).trim()
}

/**
 * Generate consistent ID for address result
 */
export function generateId(
  formattedAddress: string,
  coordinates?: { lat: number; lng: number }
): string {
  const base = formattedAddress.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const coords = coordinates ? `${coordinates.lat.toFixed(6)}-${coordinates.lng.toFixed(6)}` : ''
  return `${base}-${coords}`.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  )
}
