import { BaseGeocodingProvider, AddressUtils } from './base'
import type { AddressResult, SearchOptions, ProviderConfig } from '../types'
import { GeocodingError } from '../types'

/**
 * Google Places API provider implementation
 */
export class GooglePlacesProvider extends BaseGeocodingProvider {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api'

  constructor(config: ProviderConfig) {
    super(config)
  }

  /**
   * Search for addresses using Places Autocomplete
   */
  async search(query: string, options: SearchOptions = {}): Promise<AddressResult[]> {
    if (!query.trim()) return []

    try {
      const url = this.buildAutocompleteUrl(query, options)
      const response = await this.fetchWithErrorHandling(url)

      if (response.status === 'OK' && response.predictions) {
        const results = await this.processAutocompleteResults(response.predictions, options)
        return this.filterByZoomLevel(results, options.zoomLevel)
      }

      if (response.status === 'ZERO_RESULTS') {
        return []
      }

      throw new GeocodingError(
        `Google Places API error: ${response.error_message || response.status}`,
        response.status,
        'google',
        response
      )
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
      const url = this.buildGeocodingUrl(address, options)
      const response = await this.fetchWithErrorHandling(url)

      if (response.status === 'OK' && response.results && response.results.length > 0) {
        return this.processGeocodingResult(response.results[0])
      }

      if (response.status === 'ZERO_RESULTS') {
        return null
      }

      throw new GeocodingError(
        `Google Geocoding API error: ${response.error_message || response.status}`,
        response.status,
        'google',
        response
      )
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
    if (!AddressUtils.isValidCoordinates(lat, lng)) {
      throw new GeocodingError('Invalid coordinates provided', 'INVALID_COORDINATES', 'google')
    }

    try {
      const url = this.buildReverseGeocodingUrl(lat, lng, options)
      const response = await this.fetchWithErrorHandling(url)

      if (response.status === 'OK' && response.results && response.results.length > 0) {
        return this.processGeocodingResult(response.results[0])
      }

      if (response.status === 'ZERO_RESULTS') {
        return null
      }

      throw new GeocodingError(
        `Google Reverse Geocoding API error: ${response.error_message || response.status}`,
        response.status,
        'google',
        response
      )
    } catch (error) {
      this.handleError(error, 'Reverse geocoding')
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<AddressResult | null> {
    if (!placeId) return null

    try {
      const url = this.buildPlaceDetailsUrl(placeId)
      const response = await this.fetchWithErrorHandling(url)

      if (response.status === 'OK' && response.result) {
        return this.processPlaceDetailsResult(response.result)
      }

      throw new GeocodingError(
        `Google Place Details API error: ${response.error_message || response.status}`,
        response.status,
        'google',
        response
      )
    } catch (error) {
      this.handleError(error, 'Place details lookup')
    }
  }

  /**
   * Build URL for Places Autocomplete API
   */
  private buildAutocompleteUrl(query: string, options: SearchOptions): string {
    const params = new URLSearchParams({
      input: query,
      key: this.config.apiKey,
      language: options.language || this.config.language || 'en',
    })

    // Add types restriction
    if (options.types?.length) {
      params.append('types', this.mapTypesToGoogle(options.types, options.zoomLevel))
    } else if (options.zoomLevel) {
      params.append('types', this.getTypesForZoomLevel(options.zoomLevel))
    }

    // Add country restriction
    if (options.country) {
      const countries = Array.isArray(options.country) ? options.country : [options.country]
      params.append('components', `country:${countries.join('|country:')}`)
    } else if (this.config.defaultCountry) {
      params.append('components', `country:${this.config.defaultCountry}`)
    }

    // Add location bias
    if (options.proximity) {
      params.append('location', `${options.proximity.lat},${options.proximity.lng}`)
      params.append('radius', '50000') // 50km radius
    }

    return `${this.baseUrl}/place/autocomplete/json?${params.toString()}`
  }

  /**
   * Build URL for Geocoding API
   */
  private buildGeocodingUrl(address: string, options: SearchOptions): string {
    const params = new URLSearchParams({
      address,
      key: this.config.apiKey,
      language: options.language || this.config.language || 'en',
    })

    // Add country restriction
    if (options.country) {
      const countries = Array.isArray(options.country) ? options.country : [options.country]
      params.append('components', `country:${countries.join('|country:')}`)
    } else if (this.config.defaultCountry) {
      params.append('components', `country:${this.config.defaultCountry}`)
    }

    // Add bounds restriction
    if (options.bounds) {
      const { north, south, east, west } = options.bounds
      params.append('bounds', `${south},${west}|${north},${east}`)
    }

    return `${this.baseUrl}/geocode/json?${params.toString()}`
  }

  /**
   * Build URL for Reverse Geocoding API
   */
  private buildReverseGeocodingUrl(lat: number, lng: number, options: SearchOptions): string {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: this.config.apiKey,
      language: options.language || this.config.language || 'en',
    })

    // Limit result types
    if (options.types?.length) {
      params.append('result_type', options.types.join('|'))
    }

    return `${this.baseUrl}/geocode/json?${params.toString()}`
  }

  /**
   * Build URL for Place Details API
   */
  private buildPlaceDetailsUrl(placeId: string): string {
    const params = new URLSearchParams({
      place_id: placeId,
      key: this.config.apiKey,
      fields: 'address_components,formatted_address,geometry,place_id,types',
    })

    return `${this.baseUrl}/place/details/json?${params.toString()}`
  }

  /**
   * Process autocomplete results and enrich with place details
   */
  private async processAutocompleteResults(
    predictions: any[],
    options: SearchOptions
  ): Promise<AddressResult[]> {
    const limit = Math.min(options.limit || 5, predictions.length)
    const results: AddressResult[] = []

    for (let i = 0; i < limit; i++) {
      const prediction = predictions[i]
      try {
        // Get detailed place information
        const details = await this.getPlaceDetails(prediction.place_id)
        if (details) {
          results.push(details)
        }
      } catch (error) {
        // If details fail, create basic result from prediction
        console.warn('Failed to get place details for:', prediction.place_id, error)
        results.push(this.createBasicResultFromPrediction(prediction))
      }
    }

    return results
  }

  /**
   * Process geocoding result
   */
  private processGeocodingResult(result: any): AddressResult {
    return this.normalizeGoogleResult(result)
  }

  /**
   * Process place details result
   */
  private processPlaceDetailsResult(result: any): AddressResult {
    return this.normalizeGoogleResult(result)
  }

  /**
   * Create basic result from prediction when details are unavailable
   */
  private createBasicResultFromPrediction(prediction: any): AddressResult {
    const formattedAddress = prediction.description || ''

    return {
      id: AddressUtils.generateId(formattedAddress),
      formattedAddress,
      streetNumber: '',
      route: '',
      streetAddress: '',
      locality: '',
      administrativeAreaLevel1: '',
      stateAbbreviation: '',
      postalCode: '',
      country: '',
      countryCode: '',
      coordinates: { lat: 0, lng: 0 },
      types: prediction.types || [],
      placeId: prediction.place_id,
    }
  }

  /**
   * Normalize Google API result to our standard format
   */
  private normalizeGoogleResult(result: any): AddressResult {
    const components = this.extractAddressComponents(result.address_components || [])
    const geometry = result.geometry?.location
    const coordinates = {
      lat: geometry?.lat || 0,
      lng: geometry?.lng || 0,
    }

    const streetAddress = [components.streetNumber, components.route].filter(Boolean).join(' ')

    return {
      id: AddressUtils.generateId(result.formatted_address, coordinates),
      formattedAddress: AddressUtils.normalizeComponent(result.formatted_address),
      streetNumber: components.streetNumber,
      route: components.route,
      streetAddress,
      locality: components.locality,
      administrativeAreaLevel1: components.administrativeAreaLevel1,
      stateAbbreviation: AddressUtils.getStateAbbreviation(components.administrativeAreaLevel1),
      postalCode: components.postalCode,
      country: components.country,
      countryCode: components.countryCode,
      coordinates,
      types: result.types || [],
      placeId: result.place_id,
    }
  }

  /**
   * Extract address components from Google's response format
   */
  private extractAddressComponents(addressComponents: any[]) {
    const components = {
      streetNumber: '',
      route: '',
      locality: '',
      administrativeAreaLevel1: '',
      postalCode: '',
      country: '',
      countryCode: '',
    }

    for (const component of addressComponents) {
      const types = component.types || []
      const longName = AddressUtils.normalizeComponent(component.long_name)
      const shortName = AddressUtils.normalizeComponent(component.short_name)

      if (types.includes('street_number')) {
        components.streetNumber = longName
      } else if (types.includes('route')) {
        components.route = longName
      } else if (types.includes('locality')) {
        components.locality = longName
      } else if (types.includes('administrative_area_level_1')) {
        components.administrativeAreaLevel1 = longName
      } else if (types.includes('postal_code')) {
        components.postalCode = longName
      } else if (types.includes('country')) {
        components.country = longName
        components.countryCode = shortName
      }
    }

    return components
  }

  /**
   * Map our zoom levels to Google Places types
   */
  private getTypesForZoomLevel(zoomLevel: string): string {
    switch (zoomLevel) {
      case 'street':
        return 'address'
      case 'city':
        return '(cities)'
      case 'region':
        return '(regions)'
      default:
        return 'address'
    }
  }

  /**
   * Map custom types to Google Places types
   */
  private mapTypesToGoogle(types: string[], zoomLevel?: string): string {
    const googleTypes = types.map((type) => {
      switch (type) {
        case 'street_address':
        case 'address':
          return 'address'
        case 'locality':
        case 'city':
          return '(cities)'
        case 'administrative_area_level_1':
        case 'region':
          return '(regions)'
        case 'establishment':
        case 'poi':
          return 'establishment'
        default:
          return type
      }
    })

    return googleTypes.join('|')
  }
}
