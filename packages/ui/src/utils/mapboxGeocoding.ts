// Mapbox Geocoding API integration for address autocomplete

export interface AddressSuggestion {
  id: string
  displayName: string
  fullAddress: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  rawData?: Record<string, unknown> // Mapbox-specific data
}

export interface MapboxGeocodingOptions {
  country?: string
  types?: string[]
  bbox?: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
  limit?: number
  language?: string
}

export interface MapboxGeocodingConfig {
  accessToken: string
  baseUrl?: string
}

export class MapboxGeocodingService {
  private config: MapboxGeocodingConfig
  private baseUrl: string

  constructor(config: MapboxGeocodingConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.mapbox.com/geocoding/v5/mapbox.places'
  }

  isConfigured(): boolean {
    return !!this.config.accessToken
  }

  async search(query: string, options: MapboxGeocodingOptions = {}): Promise<AddressSuggestion[]> {
    if (!this.isConfigured() || !query.trim()) {
      return []
    }

    try {
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        limit: String(options.limit || 10),
        language: options.language || 'en',
        ...(options.country && { country: options.country }),
        ...(options.types && options.types.length > 0 && { types: options.types.join(',') }),
        ...(options.bbox && { bbox: options.bbox.join(',') }),
      })

      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(query)}.json?${params}`, {
        headers: {
          'User-Agent': 'SCF-Neue/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`Mapbox API request failed: ${response.status}`)
      }

      const data = await response.json()

      return this.transformResults(data.features || [])
    } catch (error) {
      console.warn('Mapbox geocoding search failed:', error)
      return []
    }
  }

  private transformResults(features: Record<string, unknown>[]): AddressSuggestion[] {
    return features.map((feature, index) => {
      const properties = (feature.properties as Record<string, unknown>) || {}
      const context = (feature.context as Record<string, unknown>[]) || []

      // Extract address components from context
      const place =
        (context.find((c: Record<string, unknown>) => (c.id as string)?.startsWith('place'))
          ?.text as string) || ''
      const region =
        (context.find((c: Record<string, unknown>) => (c.id as string)?.startsWith('region'))
          ?.text as string) || ''
      const postcode =
        (context.find((c: Record<string, unknown>) => (c.id as string)?.startsWith('postcode'))
          ?.text as string) || ''
      const country =
        (context.find((c: Record<string, unknown>) => (c.id as string)?.startsWith('country'))
          ?.text as string) || ''

      // Determine street address
      const street = (properties.address as string) || (feature.text as string) || ''

      return {
        id: (feature.id as string) || `mapbox-${index}`,
        displayName: street,
        fullAddress: (feature.place_name as string) || (feature.text as string) || '',
        street: street,
        city: place,
        state: region,
        zipCode: postcode,
        country: country,
        coordinates: (feature.geometry as { coordinates?: number[] })?.coordinates
          ? {
              latitude: (feature.geometry as { coordinates: number[] }).coordinates[1],
              longitude: (feature.geometry as { coordinates: number[] }).coordinates[0],
            }
          : undefined,
        rawData: feature,
      }
    })
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(
    lat: number,
    lng: number,
    options: Omit<MapboxGeocodingOptions, 'types'> = {}
  ): Promise<AddressSuggestion[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        limit: String(options.limit || 1),
        language: options.language || 'en',
        ...(options.country && { country: options.country }),
      })

      const response = await fetch(`${this.baseUrl}/${lng},${lat}.json?${params}`, {
        headers: {
          'User-Agent': 'SCF-Neue/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`Mapbox reverse geocoding failed: ${response.status}`)
      }

      const data = await response.json()

      return this.transformResults(data.features || [])
    } catch (error) {
      console.warn('Mapbox reverse geocoding failed:', error)
      return []
    }
  }
}

// Create a default instance (will need to be configured with access token)
export function createMapboxGeocodingService(
  accessToken: string,
  baseUrl?: string
): MapboxGeocodingService {
  return new MapboxGeocodingService({ accessToken, baseUrl })
}

// Default configuration
export const DEFAULT_MAPBOX_CONFIG = {
  accessToken: '', // Must be provided
  limit: 5,
  language: 'en',
  country: 'US',
} as const
