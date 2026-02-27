/**
 * LocationListInput – multiple location inputs with add/remove.
 * Uses AddressAutocomplete when provider is supplied; otherwise plain text inputs.
 */

import { useCallback, useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Stack } from '../Layout'
import { Button } from '../Button'
import { Input } from '../Input'
import { AddressAutocomplete } from './AddressAutocomplete'
import type { AddressResult } from './Address.types'
import type { LocationListInputProps } from './Address.types'

export function LocationListInput({
  value = [],
  onChange,
  maxLocations = 5,
  helpText,
  placeholder = 'Search for a location...',
  provider,
  disabled = false,
}: LocationListInputProps) {
  const [fieldCount, setFieldCount] = useState(value.length || 1)

  useEffect(() => {
    if (value.length > 0) setFieldCount((prev) => Math.max(value.length, prev))
    else setFieldCount(1)
  }, [value.length])

  const handleChange = useCallback(
    (index: number, location: string) => {
      const next = [...value]
      while (next.length <= index) next.push('')
      next[index] = location
      onChange(next.filter(Boolean))
    },
    [value, onChange]
  )

  const handleAddressSelect = useCallback(
    (index: number, address: AddressResult) => {
      handleChange(index, address.formattedAddress)
    },
    [handleChange]
  )

  const handleAdd = useCallback(() => {
    if (fieldCount >= maxLocations) return
    setFieldCount((c) => c + 1)
  }, [fieldCount, maxLocations])

  const handleRemove = useCallback(
    (index: number) => {
      const next = value.filter((_, i) => i !== index)
      onChange(next)
      setFieldCount((c) => Math.max(1, c - 1))
    },
    [value, onChange]
  )

  const slots = Array.from({ length: fieldCount }, (_, i) => i)

  return (
    <Stack gap={16}>
      {slots.map((index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            {provider ? (
              <AddressAutocomplete
                value={value[index] ?? ''}
                onAddressSelect={(addr) => handleAddressSelect(index, addr)}
                onChange={(text) => handleChange(index, text)}
                placeholder={placeholder}
                provider={provider}
                disabled={disabled}
              />
            ) : (
              <Input
                value={value[index] ?? ''}
                onChangeText={(text) => handleChange(index, text)}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleRemove(index)}
            disabled={disabled || value.length === 0}
            style={{ minWidth: 40 }}
          >
            −
          </Button>
        </View>
      ))}
      {fieldCount < maxLocations && (
        <Button variant="outline" size="sm" onPress={handleAdd} disabled={disabled}>
          + Add location
        </Button>
      )}
      {helpText && <Text style={{ fontSize: 12, color: '#6b7280' }}>{helpText}</Text>}
    </Stack>
  )
}
