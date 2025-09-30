import React, { useState, useCallback, useEffect } from 'react'
import { YStack, XStack, Input, Text, Button } from 'tamagui'
import { ChevronDown, ChevronRight } from '@tamagui/lucide-icons'
import { FieldError } from '../FieldError'
import { AddressAutocomplete } from './AddressAutocomplete'
import type { AddressFormProps, AddressResult } from './types'

/**
 * Address Form Component
 *
 * Comprehensive address input with autocomplete and individual field editing.
 * Perfect for forms where users need to enter complete address information.
 *
 * @example
 * ```tsx
 * // Callback-based integration (recommended)
 * <AddressForm
 *   onAddressSelect={(address) => {
 *     setValue('address.street', address.streetAddress)
 *     setValue('address.city', address.locality)
 *     setValue('address.state', address.stateAbbreviation)
 *     setValue('address.zip', address.postalCode)
 *   }}
 *   mode="hybrid"
 *   placeholder="Search for your address..."
 * />
 *
 * // Direct integration with react-hook-form
 * <AddressForm
 *   formMethods={{ setValue, trigger }}
 *   fieldMapping={{
 *     street: 'address.street',
 *     city: 'address.city',
 *     state: 'address.state',
 *     zip: 'address.zip',
 *   }}
 *   mode="hybrid"
 * />
 * ```
 */
export function AddressForm({
  mode = 'hybrid',
  addressValue,
  onAddressChange,
  onAddressSelect,
  fieldMapping,
  formMethods,
  value,
  onChange,
  placeholder = 'Search for your address...',
  error,
  disabled = false,
  provider = 'google',
  apiKey,
  searchOptions = {},
  zoomLevel = 'street',
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
}: AddressFormProps) {
  // Internal address state
  const [internalAddress, setInternalAddress] = useState<Partial<AddressResult>>({
    streetNumber: '',
    route: '',
    streetAddress: '',
    locality: '',
    administrativeAreaLevel1: '',
    stateAbbreviation: '',
    postalCode: '',
    country: '',
    countryCode: 'US',
    formattedAddress: '',
  })

  // Collapsible state for hybrid mode
  const [isExpanded, setIsExpanded] = useState(false)

  // Use controlled address value if provided
  const currentAddress = addressValue || internalAddress

  // Update internal state when external address value changes
  useEffect(() => {
    if (addressValue && addressValue !== internalAddress) {
      setInternalAddress(addressValue)
    }
  }, [addressValue])

  // Handle autocomplete address selection
  const handleAutocompleteSelect = useCallback(
    (address: AddressResult) => {
      const newAddress = {
        streetNumber: address.streetNumber,
        route: address.route,
        streetAddress: address.streetAddress,
        locality: address.locality,
        administrativeAreaLevel1: address.administrativeAreaLevel1,
        stateAbbreviation: address.stateAbbreviation,
        postalCode: address.postalCode,
        country: address.country,
        countryCode: address.countryCode,
        formattedAddress: address.formattedAddress,
        coordinates: address.coordinates,
      }

      // Update internal state
      setInternalAddress(newAddress)

      // Call external handlers
      onAddressChange?.(newAddress)
      onAddressSelect?.(address)

      // Update form fields via react-hook-form integration
      if (formMethods && fieldMapping) {
        const { setValue, trigger } = formMethods

        if (fieldMapping.street) {
          setValue(fieldMapping.street, address.streetAddress)
        }
        if (fieldMapping.city) {
          setValue(fieldMapping.city, address.locality)
        }
        if (fieldMapping.state) {
          setValue(
            fieldMapping.state,
            address.stateAbbreviation || address.administrativeAreaLevel1
          )
        }
        if (fieldMapping.zip) {
          setValue(fieldMapping.zip, address.postalCode)
        }
        if (fieldMapping.country) {
          setValue(fieldMapping.country, address.country)
        }

        // Trigger validation if available
        if (trigger) {
          Object.values(fieldMapping).forEach((fieldName) => {
            if (fieldName) trigger(fieldName)
          })
        }
      }
    },
    [onAddressChange, onAddressSelect, formMethods, fieldMapping, internalAddress]
  )

  // Handle individual field changes
  const handleFieldChange = useCallback(
    (field: keyof Partial<AddressResult>, newValue: string) => {
      const updatedAddress = {
        ...currentAddress,
        [field]: newValue,
      }

      // Update street address when street number or route changes
      if (field === 'streetNumber' || field === 'route') {
        const streetNumber = field === 'streetNumber' ? newValue : currentAddress.streetNumber || ''
        const route = field === 'route' ? newValue : currentAddress.route || ''
        updatedAddress.streetAddress = [streetNumber, route].filter(Boolean).join(' ')
      }

      setInternalAddress(updatedAddress)
      onAddressChange?.(updatedAddress)

      // Update form fields via react-hook-form integration
      if (formMethods && fieldMapping) {
        const { setValue, trigger } = formMethods

        // Map internal field names to form field names
        const fieldNameMap: Record<string, string | undefined> = {
          streetNumber: fieldMapping.street,
          route: fieldMapping.street,
          streetAddress: fieldMapping.street,
          locality: fieldMapping.city,
          administrativeAreaLevel1: fieldMapping.state,
          stateAbbreviation: fieldMapping.state,
          postalCode: fieldMapping.zip,
          country: fieldMapping.country,
        }

        const formFieldName = fieldNameMap[field]
        if (formFieldName && setValue) {
          let valueToSet = newValue

          // Special handling for street address
          if ((field === 'streetNumber' || field === 'route') && fieldMapping.street) {
            valueToSet = updatedAddress.streetAddress || ''
          }

          setValue(formFieldName, valueToSet)

          if (trigger) {
            trigger(formFieldName)
          }
        }
      }
    },
    [currentAddress, onAddressChange, formMethods, fieldMapping]
  )

  // Render based on mode
  switch (mode) {
    case 'autocomplete-only':
      return (
        <AddressAutocomplete
          value={value}
          onChange={onChange}
          onAddressSelect={handleAutocompleteSelect}
          placeholder={placeholder}
          error={error}
          disabled={disabled}
          provider={provider}
          apiKey={apiKey}
          searchOptions={searchOptions}
          zoomLevel={zoomLevel}
          debounceMs={debounceMs}
          minLength={minLength}
          maxResults={maxResults}
        />
      )

    case 'full':
      return (
        <YStack gap="$3" position="relative" zIndex={999}>
          <Text fontWeight="600">Address</Text>
          <YStack gap="$2">
            {/* Street Address */}
            <Input
              placeholder="Street address"
              value={currentAddress.streetAddress || ''}
              onChangeText={(text) => handleFieldChange('streetAddress', text)}
              disabled={disabled}
            />

            {/* City and State */}
            <XStack gap="$2">
              <Input
                placeholder="City"
                value={currentAddress.locality || ''}
                onChangeText={(text) => handleFieldChange('locality', text)}
                disabled={disabled}
                flex={1}
              />
              <Input
                placeholder="State"
                value={
                  currentAddress.stateAbbreviation || currentAddress.administrativeAreaLevel1 || ''
                }
                onChangeText={(text) => handleFieldChange('stateAbbreviation', text)}
                disabled={disabled}
                flex={1}
              />
            </XStack>

            {/* ZIP and Country */}
            <XStack gap="$2">
              <Input
                placeholder="ZIP Code"
                value={currentAddress.postalCode || ''}
                onChangeText={(text) => handleFieldChange('postalCode', text)}
                disabled={disabled}
                flex={1}
              />
              <Input
                placeholder="Country"
                value={currentAddress.country || ''}
                onChangeText={(text) => handleFieldChange('country', text)}
                disabled={disabled}
                flex={2}
              />
            </XStack>
          </YStack>
          <FieldError message={error} />
        </YStack>
      )

    case 'hybrid':
    default:
      return (
        <YStack gap="$3" position="relative" zIndex={999}>
          {/* Autocomplete Search */}
          <AddressAutocomplete
            value={value || currentAddress.formattedAddress}
            onChange={onChange}
            onAddressSelect={handleAutocompleteSelect}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            provider={provider}
            apiKey={apiKey}
            searchOptions={searchOptions}
            zoomLevel={zoomLevel}
            debounceMs={debounceMs}
            minLength={minLength}
            maxResults={maxResults}
          />

          {/* Expandable Toggle */}
          <Button
            variant="outlined"
            size="$3"
            onPress={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            alignSelf="flex-start"
            backgroundColor="transparent"
            borderWidth={0}
            paddingHorizontal="$2"
            paddingVertical="$1"
          >
            <XStack alignItems="center" gap="$2">
              {isExpanded ? (
                <ChevronDown size={16} color="$color11" />
              ) : (
                <ChevronRight size={16} color="$color11" />
              )}
              <Text fontSize="$3" color="$color11">
                {isExpanded ? 'Hide' : 'Edit'} individual fields
              </Text>
            </XStack>
          </Button>

          {/* Collapsible Manual Input Fields */}
          {isExpanded && (
            <YStack
              gap="$2"
              animation="quick"
              enterStyle={{ opacity: 0, y: -10 }}
              exitStyle={{ opacity: 0, y: -10 }}
            >
              {/* Street Address */}
              <Input
                placeholder="Street address"
                value={currentAddress.streetAddress || ''}
                onChangeText={(text) => handleFieldChange('streetAddress', text)}
                disabled={disabled}
                borderColor={currentAddress.streetAddress ? '$borderColor' : '$color6'}
                backgroundColor={currentAddress.streetAddress ? '$background' : '$color2'}
              />

              {/* City and State */}
              <XStack gap="$2">
                <Input
                  placeholder="City"
                  value={currentAddress.locality || ''}
                  onChangeText={(text) => handleFieldChange('locality', text)}
                  disabled={disabled}
                  flex={1}
                  borderColor={currentAddress.locality ? '$borderColor' : '$color6'}
                  backgroundColor={currentAddress.locality ? '$background' : '$color2'}
                />
                <Input
                  placeholder="State"
                  value={
                    currentAddress.stateAbbreviation ||
                    currentAddress.administrativeAreaLevel1 ||
                    ''
                  }
                  onChangeText={(text) => handleFieldChange('stateAbbreviation', text)}
                  disabled={disabled}
                  flex={1}
                  borderColor={
                    currentAddress.stateAbbreviation || currentAddress.administrativeAreaLevel1
                      ? '$borderColor'
                      : '$color6'
                  }
                  backgroundColor={
                    currentAddress.stateAbbreviation || currentAddress.administrativeAreaLevel1
                      ? '$background'
                      : '$color2'
                  }
                />
              </XStack>

              {/* ZIP and Country */}
              <XStack gap="$2">
                <Input
                  placeholder="ZIP Code"
                  value={currentAddress.postalCode || ''}
                  onChangeText={(text) => handleFieldChange('postalCode', text)}
                  disabled={disabled}
                  flex={1}
                  borderColor={currentAddress.postalCode ? '$borderColor' : '$color6'}
                  backgroundColor={currentAddress.postalCode ? '$background' : '$color2'}
                />
                <Input
                  placeholder="Country"
                  value={currentAddress.country || ''}
                  onChangeText={(text) => handleFieldChange('country', text)}
                  disabled={disabled}
                  flex={2}
                  borderColor={currentAddress.country ? '$borderColor' : '$color6'}
                  backgroundColor={currentAddress.country ? '$background' : '$color2'}
                />
              </XStack>

              {/* Clear button */}
              {(currentAddress.streetAddress ||
                currentAddress.locality ||
                currentAddress.postalCode) && (
                <Button
                  variant="outlined"
                  size="$3"
                  alignSelf="flex-start"
                  onPress={() => {
                    const emptyAddress = {
                      streetNumber: '',
                      route: '',
                      streetAddress: '',
                      locality: '',
                      administrativeAreaLevel1: '',
                      stateAbbreviation: '',
                      postalCode: '',
                      country: '',
                      countryCode: 'US',
                      formattedAddress: '',
                    }
                    setInternalAddress(emptyAddress)
                    onAddressChange?.(emptyAddress)
                    onChange?.('')
                  }}
                  disabled={disabled}
                >
                  <Text fontSize="$3">Clear Address</Text>
                </Button>
              )}
            </YStack>
          )}
        </YStack>
      )
  }
}
