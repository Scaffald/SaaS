/**
 * Core types for address autocomplete functionality
 */

// Core address result structure (normalized across providers)
export interface AddressResult {
  /** Unique identifier for the result */
  id: string
  /** Full formatted address string */
  formattedAddress: string
  /** Street number (e.g. "123") */
  streetNumber: string
  /** Route/street name (e.g. "Main Street") */
  route: string
  /** Full street address (streetNumber + route) */
  streetAddress: string
  /** City/locality */
  locality: string
  /** State/administrative area level 1 */
  administrativeAreaLevel1: string
  /** State abbreviation (e.g. "CA") */
  stateAbbreviation: string
  /** Postal code */
  postalCode: string
  /** Country */
  country: string
  /** Country code (e.g. "US") */
  countryCode: string
  /** Geographic coordinates */
  coordinates: {
    lat: number
    lng: number
  }
  /** Place type for filtering */
  types: string[]
  /** Optional place ID from provider */
  placeId?: string
}

// Search options for geocoding requests
export interface SearchOptions {
  /** Limit results to specific types */
  types?: string[]
  /** Country restriction */
  country?: string | string[]
  /** Language for results */
  language?: string
  /** Geographic bounds for search */
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  /** Proximity bias point */
  proximity?: {
    lat: number
    lng: number
  }
  /** Maximum number of results */
  limit?: number
  /** Zoom level preference */
  zoomLevel?: 'street' | 'city' | 'region'
}

// Provider configuration
export interface ProviderConfig {
  provider: 'mapbox'
  apiKey: string
  defaultCountry?: string
  language?: string
  region?: string
  options?: Record<string, string | number | boolean>
}

// Base provider interface
export interface GeocodingProvider {
  /** Search for addresses matching query */
  search(query: string, options?: SearchOptions): Promise<AddressResult[]>
  /** Geocode a full address */
  geocode(address: string, options?: SearchOptions): Promise<AddressResult | null>
  /** Reverse geocode coordinates to address */
  reverseGeocode(lat: number, lng: number, options?: SearchOptions): Promise<AddressResult | null>
  /** Get place details by ID */
  getPlaceDetails?(placeId: string): Promise<AddressResult | null>
}

// Component prop types
export interface AddressAutocompleteProps {
  /** Current value */
  value?: string
  /** Callback when address is selected */
  onAddressSelect?: (address: AddressResult) => void
  /** Callback for text input changes */
  onChange?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Error message */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Provider override */
  provider?: 'mapbox'
  /** API key override */
  apiKey?: string
  /** Search options */
  searchOptions?: SearchOptions
  /** Zoom level for result filtering */
  zoomLevel?: 'street' | 'city' | 'region'
  /** Debounce delay in ms */
  debounceMs?: number
  /** Minimum characters before search */
  minLength?: number
  /** Maximum results to show */
  maxResults?: number
  /** Style props for the wrapper container */
  containerProps?: Record<string, unknown>
}

export interface AddressFormProps
  extends Omit<AddressAutocompleteProps, 'onChange' | 'onAddressSelect'> {
  /** Form integration mode */
  mode?: 'autocomplete-only' | 'full' | 'hybrid'
  /** Address value for controlled form */
  addressValue?: Partial<AddressResult>
  /** Callback with full address object */
  onAddressChange?: (address: Partial<AddressResult>) => void
  /** Callback when address is selected from autocomplete */
  onAddressSelect?: (address: AddressResult) => void
  /** Callback for text input changes */
  onChange?: (value: string) => void
  /** Field mapping for form integration */
  fieldMapping?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  /** React hook form methods for direct integration */
  formMethods?: {
    setValue: <T>(name: string, value: T) => void
    trigger?: (name: string) => Promise<boolean>
  }
}

// Context types
export interface AddressContextValue {
  provider: GeocodingProvider
  config: ProviderConfig
}

// Error types
export class GeocodingError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public originalError?: Error | unknown
  ) {
    super(message)
    this.name = 'GeocodingError'
  }
}

// Hook return types
export interface UseAddressAutocompleteReturn {
  results: AddressResult[]
  loading: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

export interface UseGeocodingProviderReturn {
  provider: GeocodingProvider | null
  isReady: boolean
  error: string | null
}
