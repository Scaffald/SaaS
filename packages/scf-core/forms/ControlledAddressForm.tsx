import { AddressForm, type AddressResult } from '@unicornlove/ui'
import { useMemo } from 'react'
import { type FieldPath, type FieldValues, type PathValue, useWatch } from 'react-hook-form'
import { Text, YStack } from '@unicornlove/ui'
import type { ControlledAddressFormProps, CustomAddressFieldMapping } from './types'

/**
 * ControlledAddressForm
 *
 * A smart wrapper around AddressForm that automatically integrates with react-hook-form.
 * Eliminates boilerplate code by handling setValue, trigger, and addressValue construction.
 *
 * @example
 * ```tsx
 * <ControlledAddressForm
 *   control={control}
 *   name="address"
 *   label="Home Address"
 *   required
 * />
 * ```
 */
export function ControlledAddressForm<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  setValue,
  trigger,
  fieldMapping = 'nested',
  storeCoordinates = true,
  coordinateFields = { lat: 'latitude', lng: 'longitude' },
  mode = 'hybrid',
  provider = 'mapbox',
  apiKey,
  zoomLevel = 'street',
  label,
  placeholder = 'Search for your address...',
  required = false,
  disabled = false,
  error,
  onAddressSelect,
  onChange,
}: ControlledAddressFormProps<TFieldValues>) {
  // Determine field paths based on mapping strategy
  const fieldPaths = useMemo(() => {
    if (typeof fieldMapping === 'object') {
      // Custom mapping
      return fieldMapping as CustomAddressFieldMapping
    }

    if (fieldMapping === 'flat') {
      // Flat structure: street, city, state, zip
      return {
        street: 'street',
        city: 'city',
        state: 'state',
        zip: 'zip',
        country: 'country',
        latitude: coordinateFields.lat,
        longitude: coordinateFields.lng,
      } as CustomAddressFieldMapping
    }

    // Default: nested structure (address.street, address.city, etc.)
    return {
      street: `${name}.street`,
      city: `${name}.city`,
      state: `${name}.state`,
      zip: `${name}.zip`,
      country: `${name}.country`,
      latitude: `${name}.${coordinateFields.lat}`,
      longitude: `${name}.${coordinateFields.lng}`,
    } as CustomAddressFieldMapping
  }, [fieldMapping, name, coordinateFields])

  // Watch all address fields
  const streetValue = useWatch({ control, name: fieldPaths.street as FieldPath<TFieldValues> })
  const cityValue = useWatch({ control, name: fieldPaths.city as FieldPath<TFieldValues> })
  const stateValue = useWatch({ control, name: fieldPaths.state as FieldPath<TFieldValues> })
  const zipValue = useWatch({ control, name: fieldPaths.zip as FieldPath<TFieldValues> })
  const countryValue = useWatch({ control, name: fieldPaths.country as FieldPath<TFieldValues> })

  // Construct addressValue from watched fields
  const addressValue = useMemo(
    () => ({
      streetAddress: streetValue || '',
      locality: cityValue || '',
      stateAbbreviation: stateValue || '',
      postalCode: zipValue || '',
      country: countryValue || '',
      formattedAddress: [streetValue, cityValue, stateValue, zipValue].filter(Boolean).join(', '),
    }),
    [streetValue, cityValue, stateValue, zipValue, countryValue]
  )

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: AddressResult) => {
    // Update all address fields
    if (fieldPaths.street) {
      setValue(
        fieldPaths.street as FieldPath<TFieldValues>,
        (address.streetAddress || '') as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.street as FieldPath<TFieldValues>)
    }

    if (fieldPaths.city) {
      setValue(
        fieldPaths.city as FieldPath<TFieldValues>,
        (address.locality || '') as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.city as FieldPath<TFieldValues>)
    }

    if (fieldPaths.state) {
      setValue(
        fieldPaths.state as FieldPath<TFieldValues>,
        (address.stateAbbreviation || address.administrativeAreaLevel1 || '') as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >
      )
      trigger?.(fieldPaths.state as FieldPath<TFieldValues>)
    }

    if (fieldPaths.zip) {
      setValue(
        fieldPaths.zip as FieldPath<TFieldValues>,
        (address.postalCode || '') as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.zip as FieldPath<TFieldValues>)
    }

    if (fieldPaths.country) {
      setValue(
        fieldPaths.country as FieldPath<TFieldValues>,
        (address.country || 'United States') as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.country as FieldPath<TFieldValues>)
    }

    // Store coordinates if enabled
    if (storeCoordinates && address.coordinates) {
      if (fieldPaths.latitude && address.coordinates.lat !== undefined) {
        setValue(
          fieldPaths.latitude as FieldPath<TFieldValues>,
          address.coordinates.lat as PathValue<TFieldValues, FieldPath<TFieldValues>>
        )
      }
      if (fieldPaths.longitude && address.coordinates.lng !== undefined) {
        setValue(
          fieldPaths.longitude as FieldPath<TFieldValues>,
          address.coordinates.lng as PathValue<TFieldValues, FieldPath<TFieldValues>>
        )
      }
    }

    // Call custom callback if provided
    onAddressSelect?.(address)
  }

  // Handle manual address changes (when user edits individual fields)
  const handleAddressChange = (address: Partial<AddressResult>) => {
    if (address.streetAddress !== undefined && fieldPaths.street) {
      setValue(
        fieldPaths.street as FieldPath<TFieldValues>,
        address.streetAddress as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.street as FieldPath<TFieldValues>)
    }

    if (address.locality !== undefined && fieldPaths.city) {
      setValue(
        fieldPaths.city as FieldPath<TFieldValues>,
        address.locality as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.city as FieldPath<TFieldValues>)
    }

    if (address.stateAbbreviation !== undefined && fieldPaths.state) {
      setValue(
        fieldPaths.state as FieldPath<TFieldValues>,
        address.stateAbbreviation as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.state as FieldPath<TFieldValues>)
    }

    if (address.postalCode !== undefined && fieldPaths.zip) {
      setValue(
        fieldPaths.zip as FieldPath<TFieldValues>,
        address.postalCode as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.zip as FieldPath<TFieldValues>)
    }

    if (address.country !== undefined && fieldPaths.country) {
      setValue(
        fieldPaths.country as FieldPath<TFieldValues>,
        address.country as PathValue<TFieldValues, FieldPath<TFieldValues>>
      )
      trigger?.(fieldPaths.country as FieldPath<TFieldValues>)
    }
  }

  // Get API key from environment if not provided
  const resolvedProvider = provider === 'google' ? 'mapbox' : provider
  const effectiveApiKey =
    apiKey || (resolvedProvider === 'mapbox' ? process.env.EXPO_PUBLIC_MAPBOX_TOKEN : undefined)

  return (
    <YStack gap="$2" position="relative" zIndex={1000}>
      {label && (
        <Text fontWeight="600">
          {label}
          {required && ' *'}
        </Text>
      )}
      <AddressForm
        mode={mode}
        provider={resolvedProvider}
        apiKey={effectiveApiKey}
        zoomLevel={zoomLevel}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        addressValue={addressValue}
        onAddressSelect={handleAddressSelect}
        onAddressChange={handleAddressChange}
        onChange={onChange}
      />
    </YStack>
  )
}
