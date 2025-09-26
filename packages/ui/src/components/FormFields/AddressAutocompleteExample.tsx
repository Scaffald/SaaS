// Example usage of AddressAutocompleteField in various scenarios

import { useState } from 'react'
import { YStack, Text, Button } from 'tamagui'
import { AddressAutocompleteField, AddressStringField } from './AddressAutocompleteField'
import type { AddressSuggestion } from '../../utils/mapboxGeocoding'

// Example 1: Simple standalone usage
export function SimpleAddressExample() {
  const [address, setAddress] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)

  return (
    <YStack gap="$4" width={400}>
      <Text fontSize="$5" fontWeight="600">
        Simple Address Input
      </Text>

      <AddressAutocompleteField
        value={address}
        onChangeText={setAddress}
        onAddressSelect={setSelectedAddress}
        placeholder="Enter your organization address..."
        label="Organization Address"
        // accessToken will be automatically loaded from environment variables
        autocompleteOptions={{
          geocodingOptions: {
            country: 'US',
            types: ['address'],
            limit: 5,
          },
        }}
      />

      {selectedAddress && (
        <YStack gap="$2" padding="$3" backgroundColor="$color2" borderRadius="$4">
          <Text fontSize="$3" fontWeight="600">
            Selected Address:
          </Text>
          <Text fontSize="$2">{selectedAddress.fullAddress}</Text>
          {selectedAddress.coordinates && (
            <Text fontSize="$2" color="$color10">
              Coordinates: {selectedAddress.coordinates.latitude},{' '}
              {selectedAddress.coordinates.longitude}
            </Text>
          )}
        </YStack>
      )}
    </YStack>
  )
}

// Example 2: Compact variant for forms
export function CompactAddressExample() {
  const [address, setAddress] = useState('')

  return (
    <YStack gap="$4" width={300}>
      <Text fontSize="$5" fontWeight="600">
        Compact Address Input
      </Text>

      <AddressAutocompleteField
        value={address}
        onChangeText={setAddress}
        placeholder="Enter address..."
        label="Address"
        variant="compact"
        // accessToken will be automatically loaded from environment variables
      />
    </YStack>
  )
}

// Example 3: Expanded variant with full address display
export function ExpandedAddressExample() {
  const [address, setAddress] = useState('')

  return (
    <YStack gap="$4" width={500}>
      <Text fontSize="$5" fontWeight="600">
        Expanded Address Input
      </Text>

      <AddressAutocompleteField
        value={address}
        onChangeText={setAddress}
        placeholder="Enter a full address..."
        label="Complete Address"
        variant="expanded"
        showFullAddress={true}
        autocompleteOptions={{
          accessToken: 'pk.YOUR_MAPBOX_ACCESS_TOKEN',
          geocodingOptions: {
            country: 'US',
            limit: 8,
          },
        }}
      />
    </YStack>
  )
}

// Example 4: Custom styled variant
export function CustomStyledExample() {
  const [address, setAddress] = useState('')

  return (
    <YStack gap="$4" width={400}>
      <Text fontSize="$5" fontWeight="600">
        Custom Styled Address Input
      </Text>

      <AddressAutocompleteField
        value={address}
        onChangeText={setAddress}
        placeholder="Enter an address..."
        label="Styled Address"
        size="$5"
        borderColor="$blue8"
        focusStyle={{
          borderColor: '$blue10',
          borderWidth: 2,
        }}
        backgroundColor="$color2"
        // accessToken will be automatically loaded from environment variables
      />
    </YStack>
  )
}

// Example 5: Integration with organization creation form
export function OrganizationFormExample() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    website: '',
  })

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    console.log('Selected address:', suggestion)
    // You can extract specific fields like:
    // - suggestion.street
    // - suggestion.city
    // - suggestion.state
    // - suggestion.zipCode
    // - suggestion.coordinates
  }

  return (
    <YStack gap="$4" width={400}>
      <Text fontSize="$5" fontWeight="600">
        Organization Creation Form
      </Text>

      <YStack gap="$3">
        <AddressAutocompleteField
          value={formData.address}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, address: value }))}
          onAddressSelect={handleAddressSelect}
          placeholder="Enter organization address..."
          label="Organization Address"
          // accessToken will be automatically loaded from environment variables
          autocompleteOptions={{
            geocodingOptions: {
              country: 'US',
              types: ['address'],
              limit: 5,
            },
          }}
        />

        <Button onPress={() => console.log('Form data:', formData)} theme="blue">
          Create Organization
        </Button>
      </YStack>
    </YStack>
  )
}
