import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { YStack, Text } from 'tamagui'

import { AddressAutocompleteInput } from './AddressAutocompleteInput'
import { AddressAutocompleteField, AddressStringField } from './AddressAutocompleteField'
import type { AddressSuggestion } from '../../utils/mapboxGeocoding'

const meta: Meta<typeof AddressAutocompleteInput> = {
  title: 'FormFields/AddressAutocompleteInput',
  component: AddressAutocompleteInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter an address...',
    label: 'Address',
  },
  render: (args) => {
    const [value, setValue] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)

    return (
      <YStack gap="$4" width={400}>
        <AddressAutocompleteInput
          {...args}
          value={value}
          onChangeText={setValue}
          onAddressSelect={setSelectedAddress}
          // accessToken will be automatically loaded from environment variables
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
  },
}

export const Compact: Story = {
  args: {
    placeholder: 'Enter address...',
    label: 'Address',
    variant: 'compact',
  },
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <YStack gap="$4" width={300}>
        <AddressAutocompleteInput
          {...args}
          value={value}
          onChangeText={setValue}
          // accessToken will be automatically loaded from environment variables
        />
      </YStack>
    )
  },
}

export const Expanded: Story = {
  args: {
    placeholder: 'Enter a full address...',
    label: 'Complete Address',
    variant: 'expanded',
    showFullAddress: true,
  },
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <YStack gap="$4" width={500}>
        <AddressAutocompleteInput
          {...args}
          value={value}
          onChangeText={setValue}
          // accessToken will be automatically loaded from environment variables
        />
      </YStack>
    )
  },
}

export const WithCustomStyling: Story = {
  args: {
    placeholder: 'Enter an address...',
    label: 'Custom Styled Address',
    size: '$5',
    borderColor: '$blue8',
    focusStyle: {
      borderColor: '$blue10',
    },
  },
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <YStack gap="$4" width={400}>
        <AddressAutocompleteInput
          {...args}
          value={value}
          onChangeText={setValue}
          // accessToken will be automatically loaded from environment variables
        />
      </YStack>
    )
  },
}

export const WithCustomOptions: Story = {
  args: {
    placeholder: 'Enter an address...',
    label: 'Address (US Only)',
    autocompleteOptions: {
      accessToken: 'pk.YOUR_MAPBOX_ACCESS_TOKEN',
      geocodingOptions: {
        country: 'US',
        types: ['address'],
        limit: 3,
      },
    },
  },
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <YStack gap="$4" width={400}>
        <AddressAutocompleteInput {...args} value={value} onChangeText={setValue} />
        <Text fontSize="$2" color="$color10">
          Note: Uses Mapbox Geocoding API with environment token
        </Text>
      </YStack>
    )
  },
}
