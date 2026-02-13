/**
 * Address – provider-agnostic address autocomplete and forms.
 * Supply a GeocodingProvider (e.g. Mapbox adapter) from your app.
 */

export { AddressAutocomplete } from './AddressAutocomplete'
export { AddressForm } from './AddressForm'
export { LocationListInput } from './LocationListInput'
export { useAddressAutocomplete } from './useAddressAutocomplete'

export type {
  AddressResult,
  AddressSearchOptions,
  GeocodingProvider,
  AddressAutocompleteProps,
  AddressFormProps,
  LocationListInputProps,
} from './Address.types'

export type { UseAddressAutocompleteConfig, UseAddressAutocompleteReturn } from './useAddressAutocomplete'
