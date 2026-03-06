/**
 * AddressForm – address input with autocomplete and optional manual fields.
 * Provider-agnostic: pass a GeocodingProvider to AddressAutocomplete.
 */

import { useCallback, useState } from 'react'
import { Pressable, Text } from 'react-native'
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
  manualFieldsVariant = 'always',
  expandLabel = 'Edit address manually',
  collapseLabel = 'Hide',
  ...autocompleteProps
}: AddressFormProps) {
  const [manualExpanded, setManualExpanded] = useState(false)

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

  const hasManualFields = mode === 'full' || mode === 'hybrid'
  const useExpandVariant = hasManualFields && manualFieldsVariant === 'expand'
  const showManualFields =
    hasManualFields && (!useExpandVariant || manualExpanded)
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
      {useExpandVariant && !manualExpanded && (
        <Pressable
          onPress={() => setManualExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={expandLabel}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            paddingVertical: 8,
            paddingHorizontal: 0,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, color: '#2563eb' }}>{expandLabel}</Text>
        </Pressable>
      )}
      {showManualFields && (
        <Stack gap={12}>
          {useExpandVariant && (
            <Pressable
              onPress={() => setManualExpanded(false)}
              accessibilityRole="button"
              accessibilityLabel={collapseLabel}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                paddingVertical: 4,
                paddingHorizontal: 0,
                marginBottom: 4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 13, color: '#6b7280' }}>{collapseLabel}</Text>
            </Pressable>
          )}
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
