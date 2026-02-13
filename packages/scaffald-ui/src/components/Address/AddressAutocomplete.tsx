/**
 * AddressAutocomplete – input with address suggestions dropdown.
 * Provider-agnostic: pass a GeocodingProvider (e.g. from your Mapbox adapter).
 */

import { useCallback, useEffect, useState } from 'react'
import { View, ScrollView, Pressable, Text } from 'react-native'
import { Input } from '../Input'
import { useAddressAutocomplete } from './useAddressAutocomplete'
import type { AddressAutocompleteProps, AddressResult } from './Address.types'

export function AddressAutocomplete({
  value: controlledValue,
  onAddressSelect,
  onChange,
  placeholder = 'Search addresses...',
  error,
  errorMessage,
  disabled = false,
  provider,
  searchOptions,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(controlledValue ?? '')
  const [open, setOpen] = useState(false)
  const {
    results,
    loading,
    error: searchError,
    search,
    clearResults,
  } = useAddressAutocomplete({
    provider: provider ?? null,
    searchOptions,
    debounceMs,
    minLength,
    maxResults,
  })

  useEffect(() => {
    if (controlledValue !== undefined) setInputValue(controlledValue)
  }, [controlledValue])

  const handleChange = useCallback(
    (text: string) => {
      setInputValue(text)
      onChange?.(text)
      if (text.trim().length >= minLength) search(text)
      else clearResults()
      setOpen(true)
    },
    [minLength, search, clearResults, onChange]
  )

  const handleSelect = useCallback(
    (address: AddressResult) => {
      setInputValue(address.formattedAddress)
      onChange?.(address.formattedAddress)
      onAddressSelect?.(address)
      clearResults()
      setOpen(false)
    },
    [onChange, onAddressSelect, clearResults]
  )

  const showList = open && (results.length > 0 || loading)
  const displayError =
    typeof error === 'string' ? error : (errorMessage ?? searchError ?? undefined)

  return (
    <View style={{ position: 'relative' }}>
      <Input
        value={inputValue}
        onChangeText={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        error={Boolean(displayError)}
        errorMessage={displayError}
        disabled={disabled}
      />
      {showList && (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            maxHeight: 240,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {loading ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#3b82f6',
                  borderTopColor: 'transparent',
                }}
              />
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 236 }}>
              {results.map((addr) => (
                <Pressable
                  key={addr.id}
                  onPress={() => handleSelect(addr)}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? '#f3f4f6' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 14, color: '#111827' }}>{addr.formattedAddress}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}
