/**
 * AddressForm – address input with autocomplete and optional manual fields.
 * Provider-agnostic: pass a GeocodingProvider to AddressAutocomplete.
 */

import { useCallback } from 'react'
import { Stack } from '../Layout'
import { Input } from '../Input'
import { AddressAutocomplete } from './AddressAutocomplete'
import type { AddressFormProps, AddressResult } from './Address.types'

export function AddressForm({
  value,
  onAddressSelect,
  onAddressChange,
  onChange,
  addressValue,
  mode = 'autocomplete-only',
  placeholder = 'Search addresses...',
  provider,
  ...autocompleteProps
}: AddressFormProps) {
  const handleSelect = useCallback(
    (address: AddressResult) => {
      onAddressSelect?.(address)
      onAddressChange?.({
        formattedAddress: address.formattedAddress,
        streetAddress: address.streetAddress,
        locality: address.locality,
        administrativeAreaLevel1: address.administrativeAreaLevel1,
        stateAbbreviation: address.stateAbbreviation,
        postalCode: address.postalCode,
        country: address.country,
        countryCode: address.countryCode,
        coordinates: address.coordinates,
      })
    },
    [onAddressSelect, onAddressChange]
  )

  const showManualFields = mode === 'full' || mode === 'hybrid'
  const addr = addressValue ?? {}

  return (
    <Stack gap={16}>
      <AddressAutocomplete
        value={value}
        onAddressSelect={handleSelect}
        onChange={onChange}
        placeholder={placeholder}
        provider={provider}
        {...autocompleteProps}
      />
      {showManualFields && (
        <Stack gap={12}>
          <Input
            label="Street"
            value={addr.streetAddress ?? ''}
            onChangeText={(t) => onAddressChange?.({ ...addr, streetAddress: t })}
            placeholder="Street address"
          />
          <Stack gap={12} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Input
              label="City"
              value={addr.locality ?? ''}
              onChangeText={(t) => onAddressChange?.({ ...addr, locality: t })}
              placeholder="City"
              style={{ flex: 1, minWidth: 120 }}
            />
            <Input
              label="State"
              value={addr.stateAbbreviation ?? addr.administrativeAreaLevel1 ?? ''}
              onChangeText={(t) => onAddressChange?.({ ...addr, stateAbbreviation: t, administrativeAreaLevel1: t })}
              placeholder="State"
              style={{ width: 80 }}
            />
            <Input
              label="ZIP"
              value={addr.postalCode ?? ''}
              onChangeText={(t) => onAddressChange?.({ ...addr, postalCode: t })}
              placeholder="ZIP"
              style={{ width: 100 }}
            />
          </Stack>
          <Input
            label="Country"
            value={addr.country ?? ''}
            onChangeText={(t) => onAddressChange?.({ ...addr, country: t })}
            placeholder="Country"
          />
        </Stack>
      )}
    </Stack>
  )
}
