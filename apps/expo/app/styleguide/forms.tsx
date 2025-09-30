import { useState, useCallback } from 'react'
import {
  ScrollView,
  YStack,
  Text,
  XStack,
  Button,
  Input,
  Select,
  Adapt,
  Sheet,
  Separator,
} from 'tamagui'
import {
  PhoneNumberInput,
  AddressAutocomplete,
  AddressForm,
  AvatarImagePicker,
  FieldError,
} from '@app/ui'

export default function FormsPage() {
  // State for basic inputs
  const [basicInput, setBasicInput] = useState('')
  const [basicInputError, setBasicInputError] = useState('')
  const [basicInputDisabled, setBasicInputDisabled] = useState(false)
  const [inputSize, setInputSize] = useState<'$2' | '$3' | '$4' | '$5'>('$4')

  // State for phone input
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneDisabled, setPhoneDisabled] = useState(false)
  const [phoneCountry, setPhoneCountry] = useState('US')

  // State for address components
  const [addressSearch, setAddressSearch] = useState('')
  const [addressError, setAddressError] = useState('')
  const [addressMode, setAddressMode] = useState<'autocomplete-only' | 'full' | 'hybrid'>('hybrid')
  const [addressDisabled, setAddressDisabled] = useState(false)

  // State for avatar picker
  const [avatarImage, setAvatarImage] = useState('')
  const [avatarSize, setAvatarSize] = useState(120)
  const [avatarDisabled, setAvatarDisabled] = useState(false)

  // State for select
  const [selectValue, setSelectValue] = useState('')
  const [selectError, setSelectError] = useState('')
  const [selectDisabled, setSelectDisabled] = useState(false)

  // Demo options
  const sizeOptions = [
    { value: '$2', label: 'Small' },
    { value: '$3', label: 'Medium' },
    { value: '$4', label: 'Large' },
    { value: '$5', label: 'Extra Large' },
  ]

  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
  ]

  const addressModeOptions = [
    { value: 'autocomplete-only', label: 'Autocomplete Only' },
    { value: 'hybrid', label: 'Hybrid (Recommended)' },
    { value: 'full', label: 'Full Manual' },
  ]

  const avatarSizeOptions = [
    { value: 80, label: 'Small (80px)' },
    { value: 120, label: 'Medium (120px)' },
    { value: 160, label: 'Large (160px)' },
    { value: 200, label: 'Extra Large (200px)' },
  ]

  const toggleBasicError = () => {
    setBasicInputError(basicInputError ? '' : 'This field is required')
  }

  const togglePhoneError = () => {
    setPhoneError(phoneError ? '' : 'Please enter a valid phone number')
  }

  const toggleAddressError = () => {
    setAddressError(addressError ? '' : 'Please enter a valid address')
  }

  const toggleSelectError = () => {
    setSelectError(selectError ? '' : 'Please make a selection')
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$8" alignItems="center">
        <Text fontSize="$8" fontWeight="600" color="$color">
          Form Components Demo
        </Text>

        <Text fontSize="$4" color="$color10" textAlign="center" maxWidth={400}>
          Interactive examples of all form components with different states and configurations
        </Text>

        {/* Basic Input Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Basic Input Fields
          </Text>

          {/* Input Size Selector */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            {sizeOptions.map((option) => (
              <Button
                key={option.value}
                variant={inputSize === option.value ? 'outlined' : undefined}
                onPress={() => setInputSize(option.value as '$2' | '$3' | '$4' | '$5')}
                size="$3"
              >
                <Text fontSize="$2">{option.label}</Text>
              </Button>
            ))}
          </XStack>

          {/* Input Controls */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            <Button
              variant={basicInputDisabled ? 'outlined' : undefined}
              onPress={() => setBasicInputDisabled(!basicInputDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              variant={basicInputError ? 'outlined' : undefined}
              onPress={toggleBasicError}
              size="$3"
            >
              <Text fontSize="$2">Error State</Text>
            </Button>
          </XStack>

          {/* Input Examples */}
          <YStack gap="$3" width="100%">
            <Input
              placeholder="Standard text input"
              value={basicInput}
              onChangeText={setBasicInput}
              size={inputSize}
              disabled={basicInputDisabled}
              borderColor={basicInputError ? '$red8' : '$borderColor'}
            />
            <FieldError message={basicInputError} />

            <Input
              placeholder="Password input"
              secureTextEntry
              size={inputSize}
              disabled={basicInputDisabled}
            />

            <Input
              placeholder="Email input"
              keyboardType="email-address"
              size={inputSize}
              disabled={basicInputDisabled}
            />

            <Input
              placeholder="Number input"
              keyboardType="numeric"
              size={inputSize}
              disabled={basicInputDisabled}
            />
          </YStack>
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Select Component Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Select Component
          </Text>

          {/* Select Controls */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            <Button
              variant={selectDisabled ? 'outlined' : undefined}
              onPress={() => setSelectDisabled(!selectDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              variant={selectError ? 'outlined' : undefined}
              onPress={toggleSelectError}
              size="$3"
            >
              <Text fontSize="$2">Error State</Text>
            </Button>
          </XStack>

          {/* Select Example */}
          <YStack gap="$3" width="100%">
            <Select value={selectValue} onValueChange={setSelectValue} size={inputSize}>
              <Select.Trigger borderColor={selectError ? '$red8' : '$borderColor'}>
                <Select.Value placeholder="Choose an option..." />
              </Select.Trigger>

              <Adapt when="sm" platform="touch">
                <Sheet modal dismissOnSnapToBottom>
                  <Sheet.Frame>
                    <Sheet.ScrollView>
                      <Adapt.Contents />
                    </Sheet.ScrollView>
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={200000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Item value="option1" index={0}>
                    <Select.ItemText>Option 1</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="option2" index={1}>
                    <Select.ItemText>Option 2</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="option3" index={2}>
                    <Select.ItemText>Option 3</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="option4" index={3}>
                    <Select.ItemText>Option 4</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
            <FieldError message={selectError} />
          </YStack>
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Phone Number Input Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Phone Number Input
          </Text>

          {/* Phone Country Selector */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            {countryOptions.map((option) => (
              <Button
                key={option.value}
                variant={phoneCountry === option.value ? 'outlined' : undefined}
                onPress={() => setPhoneCountry(option.value)}
                size="$3"
              >
                <Text fontSize="$2">{option.label}</Text>
              </Button>
            ))}
          </XStack>

          {/* Phone Controls */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            <Button
              variant={phoneDisabled ? 'outlined' : undefined}
              onPress={() => setPhoneDisabled(!phoneDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              variant={phoneError ? 'outlined' : undefined}
              onPress={togglePhoneError}
              size="$3"
            >
              <Text fontSize="$2">Error State</Text>
            </Button>
          </XStack>

          {/* Phone Input Example */}
          <PhoneNumberInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            defaultCountry={phoneCountry}
            error={phoneError}
            disabled={phoneDisabled}
            placeholder="Enter phone number"
          />
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Address Components Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Address Components
          </Text>

          {/* Address Mode Selector */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            {addressModeOptions.map((option) => (
              <Button
                key={option.value}
                variant={addressMode === option.value ? 'outlined' : undefined}
                onPress={() =>
                  setAddressMode(option.value as 'autocomplete-only' | 'full' | 'hybrid')
                }
                size="$3"
              >
                <Text fontSize="$2">{option.label}</Text>
              </Button>
            ))}
          </XStack>

          {/* Address Controls */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            <Button
              variant={addressDisabled ? 'outlined' : undefined}
              onPress={() => setAddressDisabled(!addressDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              variant={addressError ? 'outlined' : undefined}
              onPress={toggleAddressError}
              size="$3"
            >
              <Text fontSize="$2">Error State</Text>
            </Button>
          </XStack>

          {/* Address Component Examples */}
          <YStack gap="$6" width="100%">
            {/* AddressAutocomplete with Mapbox API */}
            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  AddressAutocomplete (Mapbox API)
                </Text>
                <Text fontSize="$2" color="$color9">
                  Real Mapbox Places API integration - try any address
                </Text>
              </YStack>
              <AddressAutocomplete
                value={addressSearch}
                onChange={setAddressSearch}
                onAddressSelect={(address) => {
                  console.log('Selected real address:', address)
                }}
                placeholder="Search for a real address..."
                error={addressError}
                disabled={addressDisabled}
                provider="mapbox"
                apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
              />
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* AddressForm with Mapbox API */}
            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  AddressForm ({addressMode}) - Mapbox API
                </Text>
                <Text fontSize="$2" color="$color9">
                  {addressMode === 'hybrid'
                    ? 'Includes autocomplete search + manual fields'
                    : addressMode === 'autocomplete-only'
                      ? 'Search only - no manual input fields'
                      : 'Manual input fields only'}
                </Text>
              </YStack>
              <AddressForm
                mode={addressMode}
                placeholder="Search for your real address..."
                error={addressError}
                disabled={addressDisabled}
                provider="mapbox"
                apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
                onAddressSelect={(address) => {
                  console.log('Selected real address from form:', address)
                }}
              />
            </YStack>
          </YStack>
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Avatar Image Picker Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Avatar Image Picker
          </Text>

          {/* Avatar Size Selector */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            {avatarSizeOptions.map((option) => (
              <Button
                key={option.value}
                variant={avatarSize === option.value ? 'outlined' : undefined}
                onPress={() => setAvatarSize(option.value)}
                size="$3"
              >
                <Text fontSize="$2">{option.label}</Text>
              </Button>
            ))}
          </XStack>

          {/* Avatar Controls */}
          <XStack gap="$2" flexWrap="wrap" justifyContent="center">
            <Button
              variant={avatarDisabled ? 'outlined' : undefined}
              onPress={() => setAvatarDisabled(!avatarDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              onPress={() =>
                setAvatarImage(
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                )
              }
              size="$3"
            >
              <Text fontSize="$2">Set Sample Image</Text>
            </Button>
            <Button onPress={() => setAvatarImage('')} size="$3">
              <Text fontSize="$2">Clear Image</Text>
            </Button>
          </XStack>

          {/* Avatar Picker Example */}
          <AvatarImagePicker
            value={avatarImage}
            onImageSelect={setAvatarImage}
            size={avatarSize}
            disabled={avatarDisabled}
            placeholder="Add Photo"
          />
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Form Patterns Section */}
        <YStack gap="$4" width="100%" maxWidth={500} alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Form Patterns
          </Text>

          <Text fontSize="$4" color="$color10" textAlign="center">
            Complete form examples combining multiple components
          </Text>

          {/* Sample Contact Form */}
          <YStack gap="$3" width="100%" padding="$4" backgroundColor="$color2" borderRadius="$4">
            <Text fontSize="$5" fontWeight="500" color="$color">
              Contact Information Form
            </Text>

            <Input placeholder="Full Name" size="$4" />

            <Input placeholder="Email Address" keyboardType="email-address" size="$4" />

            <PhoneNumberInput placeholder="Phone Number" defaultCountry="US" />

            <AddressForm
              mode="hybrid"
              placeholder="Enter your address..."
              provider="mapbox"
              apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            />

            <XStack gap="$3" justifyContent="flex-end">
              <Button size="$4">
                <Text>Cancel</Text>
              </Button>
              <Button size="$4">
                <Text>Save Contact</Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>

        {/* Footer */}
        <YStack gap="$2" alignItems="center" paddingTop="$6" paddingBottom="$4">
          <Text fontSize="$3" color="$color9" textAlign="center">
            All form components are cross-platform compatible
          </Text>
          <Text fontSize="$2" color="$color8" textAlign="center">
            Test on web, iOS, and Android for consistent behavior
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
