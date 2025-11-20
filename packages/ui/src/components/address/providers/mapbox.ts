import type { AddressResult, SearchOptions } from '../types'
import { GeocodingError } from '../types'
import {
  BaseGeocodingProvider,
  generateId,
  getStateAbbreviation,
  isValidCoordinates,
  normalizeComponent,
} from './base'

// Mapbox API response interfaces
interface MapboxGeometry {
  type: string
  coordinates: [number, number] // [lng, lat]
}

interface MapboxProperties {
  accuracy?: string
  address?: string
  category?: string
  maki?: string
  wikidata?: string
  short_code?: string
}

interface MapboxContext {
  id: string
  mapbox_id: string
  wikidata?: string
  text: string
  short_code?: string
}

interface MapboxFeature {
  id: string
  type: string
  place_type: string[]
  relevance: number
  properties: MapboxProperties
  text: string
  place_name: string
  bbox?: [number, number, number, number]
  center: [number, number] // [lng, lat]
  geometry: MapboxGeometry
  context?: MapboxContext[]
  address?: string
}

interface MapboxResponse {
  type: string
  query: string[]
  features: MapboxFeature[]
  attribution: string
}

interface AddressComponents {
  streetNumber: string
  route: string
  locality: string
  administrativeAreaLevel1: string
  stateAbbreviation: string
  postalCode: string
  country: string
  countryCode: string
}

/**
 * Mapbox Geocoding API provider implementation
 */
export class MapboxProvider extends BaseGeocodingProvider {
  private readonly baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

  /**
   * Search for addresses using Mapbox Places
   */
  async search(query: string, options: SearchOptions = {}): Promise<AddressResult[]> {
    if (!query.trim()) return []

    try {
      const url = this.buildSearchUrl(query, options)
      const rawResponse = await this.fetchWithErrorHandling(url)
      const response = (await rawResponse.json()) as MapboxResponse

      if (response.features && Array.isArray(response.features)) {
        const results = response.features.map((feature: MapboxFeature) =>
          this.normalizeMapboxResult(feature)
        )
        return this.filterByZoomLevel(results, options.zoomLevel)
      }

      return []
    } catch (error) {
      this.handleError(error, 'Address search')
    }
  }

  /**
   * Geocode a full address
   */
  async geocode(address: string, options: SearchOptions = {}): Promise<AddressResult | null> {
    if (!address.trim()) return null

    try {
      const results = await this.search(address, { ...options, limit: 1 })
      return results.length > 0 ? results[0] : null
    } catch (error) {
      this.handleError(error, 'Address geocoding')
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    lat: number,
    lng: number,
    options: SearchOptions = {}
  ): Promise<AddressResult | null> {
    if (!isValidCoordinates(lat, lng)) {
      throw new GeocodingError('Invalid coordinates provided', 'INVALID_COORDINATES', 'mapbox')
    }

    try {
      const url = this.buildReverseGeocodingUrl(lng, lat, options) // Note: Mapbox uses lng,lat order
      const rawResponse = await this.fetchWithErrorHandling(url)
      const response = (await rawResponse.json()) as MapboxResponse

      if (response.features && response.features.length > 0) {
        return this.normalizeMapboxResult(response.features[0])
      }

      return null
    } catch (error) {
      this.handleError(error, 'Reverse geocoding')
    }
  }

  /**
   * Build URL for Mapbox Places API
   */
  private buildSearchUrl(query: string, options: SearchOptions): string {
    const encodedQuery = encodeURIComponent(query)
    const params = new URLSearchParams({
      access_token: this.config.apiKey,
      language: options.language || this.config.language || 'en',
      limit: String(Math.min(options.limit || 5, 10)),
    })

    // Add types restriction
    if (options.types?.length) {
      params.append('types', this.mapTypesToMapbox(options.types, options.zoomLevel).join(','))
    } else if (options.zoomLevel) {
      params.append('types', this.getTypesForZoomLevel(options.zoomLevel).join(','))
    }

    // Add country restriction
    if (options.country) {
      const countries = Array.isArray(options.country) ? options.country : [options.country]
      params.append('country', countries.join(','))
    } else if (this.config.defaultCountry) {
      params.append('country', this.config.defaultCountry.toLowerCase())
    }

    // Add proximity bias
    if (options.proximity) {
      params.append('proximity', `${options.proximity.lng},${options.proximity.lat}`)
    }

    // Add bbox restriction
    if (options.bounds) {
      const { north, south, east, west } = options.bounds
      params.append('bbox', `${west},${south},${east},${north}`)
    }

    return `${this.baseUrl}/${encodedQuery}.json?${params.toString()}`
  }

  /**
   * Build URL for reverse geocoding
   */
  private buildReverseGeocodingUrl(lng: number, lat: number, options: SearchOptions): string {
    const params = new URLSearchParams({
      access_token: this.config.apiKey,
      language: options.language || this.config.language || 'en',
      limit: '1',
    })

    // Add types restriction for reverse geocoding
    if (options.types?.length) {
      params.append('types', this.mapTypesToMapbox(options.types).join(','))
    } else {
      // Default types for reverse geocoding
      params.append('types', 'address,poi')
    }

    return `${this.baseUrl}/${lng},${lat}.json?${params.toString()}`
  }

  /**
   * Normalize Mapbox result to our standard format
   */
  private normalizeMapboxResult(feature: MapboxFeature): AddressResult {
    const context = feature.context || []
    const coordinates = {
      lng: feature.geometry?.coordinates?.[0] || 0,
      lat: feature.geometry?.coordinates?.[1] || 0,
    }

    // Extract address components from context
    const components = this.extractAddressComponents(feature, context)

    // Handle different place types
    const placeType = this.getPlaceType(feature)
    const formattedAddress = this.buildFormattedAddress(feature, components, placeType)

    const streetAddress = [components.streetNumber, components.route].filter(Boolean).join(' ')

    return {
      id: generateId(formattedAddress, coordinates),
      formattedAddress,
      streetNumber: components.streetNumber,
      route: components.route,
      streetAddress,
      locality: components.locality,
      administrativeAreaLevel1: components.administrativeAreaLevel1,
      stateAbbreviation:
        components.stateAbbreviation || getStateAbbreviation(components.administrativeAreaLevel1),
      postalCode: components.postalCode,
      country: components.country,
      countryCode: components.countryCode,
      coordinates,
      types: this.mapboxTypesToStandard(feature.place_type || []),
      placeId: feature.id,
    }
  }

  /**
   * Extract address components from Mapbox feature and context
   */
  private extractAddressComponents(feature: MapboxFeature, context: MapboxContext[]) {
    const components = {
      streetNumber: '',
      route: '',
      locality: '',
      administrativeAreaLevel1: '',
      stateAbbreviation: '',
      postalCode: '',
      country: '',
      countryCode: '',
    }

    const properties = feature.properties || {}
    const placeName = feature.place_name || feature.text || ''

    // Extract from feature properties
    if (properties.address) {
      components.streetNumber = normalizeComponent(properties.address)
    }

    // Extract street name from place name or text
    if (feature.place_type?.includes('address')) {
      const parts = placeName.split(',')
      if (parts.length > 0) {
        const streetPart = parts[0].trim()
        // Try to separate street number from street name
        const match = streetPart.match(/^(\d+)\s+(.+)$/)
        if (match) {
          if (!components.streetNumber) components.streetNumber = match[1]
          components.route = match[2]
        } else if (!components.streetNumber) {
          components.route = streetPart
        }
      }
    } else {
      components.route = normalizeComponent(feature.text)
    }

    // Extract from context hierarchy
    for (const item of context) {
      const itemType = item.id?.split('.')[0]
      const text = normalizeComponent(item.text)
      const shortCode = normalizeComponent(item.short_code)

      switch (itemType) {
        case 'postcode':
          components.postalCode = text
          break
        case 'place':
        case 'locality':
          if (!components.locality) components.locality = text
          break
        case 'district':
          // Districts are typically counties or sub-regions, not states
          if (!components.administrativeAreaLevel1) {
            components.administrativeAreaLevel1 = text
          }
          break
        case 'region':
          // Regions are typically states or provinces - prioritize for state abbreviation
          if (!components.administrativeAreaLevel1) {
            components.administrativeAreaLevel1 = text
          }
          // Extract state abbreviation from short_code (format: US-MI)
          if (shortCode) {
            if (shortCode.includes('-') && shortCode.length > 2) {
              // Handle format like "US-MI" - extract the part after the dash
              const parts = shortCode.split('-')
              if (parts.length === 2 && parts[1].length === 2) {
                components.stateAbbreviation = parts[1].toUpperCase()
              }
            } else if (shortCode.length === 2) {
              // Handle direct abbreviation like "MI"
              components.stateAbbreviation = shortCode.toUpperCase()
            }
          }
          break
        case 'country':
          components.country = text
          if (shortCode) {
            components.countryCode = shortCode.toUpperCase()
          }
          break
      }
    }

    return components
  }

  /**
   * Determine place type from Mapbox feature
   */
  private getPlaceType(feature: MapboxFeature): string {
    const placeTypes = feature.place_type || []

    if (placeTypes.includes('address')) return 'address'
    if (placeTypes.includes('poi')) return 'poi'
    if (placeTypes.includes('place')) return 'locality'
    if (placeTypes.includes('region')) return 'region'
    if (placeTypes.includes('country')) return 'country'

    return placeTypes[0] || 'unknown'
  }

  /**
   * Build formatted address string
   */
  private buildFormattedAddress(
    feature: MapboxFeature,
    components: AddressComponents,
    _placeType: string
  ): string {
    // Use Mapbox's place_name if available as it's well formatted
    if (feature.place_name) {
      return normalizeComponent(feature.place_name)
    }

    // Fallback: construct from components
    const parts: string[] = []

    if (components.streetNumber && components.route) {
      parts.push(`${components.streetNumber} ${components.route}`)
    } else if (components.route) {
      parts.push(components.route)
    }

    if (components.locality) parts.push(components.locality)
    if (components.administrativeAreaLevel1) {
      parts.push(components.administrativeAreaLevel1)
    }
    if (components.postalCode) parts.push(components.postalCode)
    if (components.country) parts.push(components.country)

    return parts.join(', ')
  }

  /**
   * Map zoom levels to Mapbox place types
   */
  private getTypesForZoomLevel(zoomLevel: string): string[] {
    switch (zoomLevel) {
      case 'street':
        return ['address', 'poi']
      case 'city':
        return ['place', 'locality']
      case 'region':
        return ['region', 'district']
      default:
        return ['address', 'poi', 'place']
    }
  }

  /**
   * Map custom types to Mapbox place types
   */
  private mapTypesToMapbox(types: string[], _zoomLevel?: string): string[] {
    return types.map((type) => {
      switch (type) {
        case 'street_address':
        case 'address':
          return 'address'
        case 'locality':
        case 'city':
          return 'place'
        case 'administrative_area_level_1':
        case 'region':
          return 'region'
        case 'establishment':
        case 'poi':
          return 'poi'
        case 'country':
          return 'country'
        case 'postal_code':
          return 'postcode'
        default:
          return type
      }
    })
  }

  /**
   * Map Mapbox place types to our standard types
   */
  private mapboxTypesToStandard(placeTypes: string[]): string[] {
    return placeTypes.map((type) => {
      switch (type) {
        case 'address':
          return 'street_address'
        case 'poi':
          return 'establishment'
        case 'place':
          return 'locality'
        case 'region':
        case 'district':
          return 'administrative_area_level_1'
        case 'postcode':
          return 'postal_code'
        default:
          return type
      }
    })
  }

  /**
   * Handle Mapbox-specific errors
   */
  protected override handleError(error: unknown, context: string): never {
    // Type guard for error objects
    const isErrorWithMessage = (err: unknown): err is { message?: string } => {
      return typeof err === 'object' && err !== null && 'message' in err
    }

    // Handle Mapbox-specific error responses
    if (isErrorWithMessage(error) && error.message?.includes('Invalid access token')) {
      throw new GeocodingError('Invalid Mapbox access token', 'INVALID_API_KEY', 'mapbox', error)
    }

    if (isErrorWithMessage(error) && error.message?.includes('rate limit')) {
      throw new GeocodingError('Mapbox rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 'mapbox', error)
    }

    // Delegate to base error handler
    super.handleError(error, context)
  }
}
