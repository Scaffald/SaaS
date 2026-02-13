/**
 * Address module types – provider-agnostic (no Mapbox/Google dependency).
 * Supply a GeocodingProvider from your app (e.g. Mapbox adapter).
 */

/** Normalized address result (same shape across providers) */
export interface AddressResult {
  id: string
  formattedAddress: string
  streetNumber: string
  route: string
  streetAddress: string
  locality: string
  administrativeAreaLevel1: string
  stateAbbreviation: string
  postalCode: string
  country: string
  countryCode: string
  coordinates: { lat: number; lng: number }
  types?: string[]
  placeId?: string
}

/** Options for geocoding search */
export interface AddressSearchOptions {
  types?: string[]
  country?: string | string[]
  language?: string
  bounds?: { north: number; south: number; east: number; west: number }
  proximity?: { lat: number; lng: number }
  limit?: number
  zoomLevel?: 'street' | 'city' | 'region'
}

/** Provider interface – implement with Mapbox, Google, or any geocoding API */
export interface GeocodingProvider {
  search(query: string, options?: AddressSearchOptions): Promise<AddressResult[]>
  geocode?(address: string, options?: AddressSearchOptions): Promise<AddressResult | null>
  reverseGeocode?(lat: number, lng: number, options?: AddressSearchOptions): Promise<AddressResult | null>
}

export interface AddressAutocompleteProps {
  value?: string
  onAddressSelect?: (address: AddressResult) => void
  onChange?: (value: string) => void
  placeholder?: string
  error?: string | boolean
  errorMessage?: string
  disabled?: boolean
  /** Inject a geocoding provider (e.g. from your Mapbox adapter) */
  provider?: GeocodingProvider | null
  searchOptions?: AddressSearchOptions
  debounceMs?: number
  minLength?: number
  maxResults?: number
}

export interface AddressFormProps extends Omit<AddressAutocompleteProps, 'onChange' | 'onAddressSelect'> {
  mode?: 'autocomplete-only' | 'full' | 'hybrid'
  addressValue?: Partial<AddressResult>
  onAddressChange?: (address: Partial<AddressResult>) => void
  onAddressSelect?: (address: AddressResult) => void
  onChange?: (value: string) => void
  fieldMapping?: { street?: string; city?: string; state?: string; zip?: string; country?: string }
}

export interface LocationListInputProps {
  value: string[]
  onChange: (locations: string[]) => void
  maxLocations?: number
  helpText?: string
  placeholder?: string
  provider?: GeocodingProvider | null
  disabled?: boolean
}
