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

// Mock address data for demo purposes
const MOCK_ADDRESSES = [
  {
    id: '1',
    formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
    streetNumber: '1600',
    route: 'Amphitheatre Parkway',
    streetAddress: '1600 Amphitheatre Parkway',
    locality: 'Mountain View',
    administrativeAreaLevel1: 'California',
    stateAbbreviation: 'CA',
    postalCode: '94043',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 37.4219999, lng: -122.0840575 },
  },
  {
    id: '2',
    formattedAddress: '1 Apple Park Way, Cupertino, CA 95014, USA',
    streetNumber: '1',
    route: 'Apple Park Way',
    streetAddress: '1 Apple Park Way',
    locality: 'Cupertino',
    administrativeAreaLevel1: 'California',
    stateAbbreviation: 'CA',
    postalCode: '95014',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 37.3349, lng: -122.009 },
  },
  {
    id: '3',
    formattedAddress: '410 Terry Ave N, Seattle, WA 98109, USA',
    streetNumber: '410',
    route: 'Terry Ave N',
    streetAddress: '410 Terry Ave N',
    locality: 'Seattle',
    administrativeAreaLevel1: 'Washington',
    stateAbbreviation: 'WA',
    postalCode: '98109',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 47.6219653, lng: -122.3359976 },
  },
  {
    id: '4',
    formattedAddress: '350 5th Ave, New York, NY 10118, USA',
    streetNumber: '350',
    route: '5th Ave',
    streetAddress: '350 5th Ave',
    locality: 'New York',
    administrativeAreaLevel1: 'New York',
    stateAbbreviation: 'NY',
    postalCode: '10118',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 40.7484405, lng: -73.9878584 },
  },
  {
    id: '5',
    formattedAddress: '1 Hacker Way, Menlo Park, CA 94025, USA',
    streetNumber: '1',
    route: 'Hacker Way',
    streetAddress: '1 Hacker Way',
    locality: 'Menlo Park',
    administrativeAreaLevel1: 'California',
    stateAbbreviation: 'CA',
    postalCode: '94025',
    country: 'United States',
    countryCode: 'US',
    coordinates: { lat: 37.4845, lng: -122.1477 },
  },
]

// Custom mock AddressAutocomplete for demo
const MockAddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  error,
  disabled,
}: any) => {
  const [inputValue, setInputValue] = useState(value || '')
  const [showResults, setShowResults] = useState(false)
  const [filteredAddresses, setFilteredAddresses] = useState<any[]>([])

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      onChange?.(text)

      if (text.trim().length >= 2) {
        const filtered = MOCK_ADDRESSES.filter((addr) =>
          addr.formattedAddress.toLowerCase().includes(text.toLowerCase())
        ).slice(0, 3)
        setFilteredAddresses(filtered)
        setShowResults(true)
      } else {
        setShowResults(false)
        setFilteredAddresses([])
      }
    },
    [onChange]
  )

  const handleAddressSelect = useCallback(
    (address: any) => {
      setInputValue(address.formattedAddress)
      setShowResults(false)
      onAddressSelect?.(address)
      onChange?.(address.formattedAddress)
    },
    [onAddressSelect, onChange]
  )

  return (
    <YStack gap="$2" position="relative">
      <YStack position="relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => filteredAddresses.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          disabled={disabled}
          borderColor={error ? '$red8' : '$borderColor'}
        />

        {showResults && filteredAddresses.length > 0 && (
          <YStack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            backgroundColor="$background"
            borderWidth={1}
            borderColor="$borderColor"
            borderTopWidth={0}
            borderBottomLeftRadius="$4"
            borderBottomRightRadius="$4"
            maxHeight={200}
            zIndex={999999}
            boxShadow="0px 2px 8px rgba(0,0,0,0.1)"
          >
            {filteredAddresses.map((address) => (
              <Button
                key={address.id}
                backgroundColor="transparent"
                borderWidth={0}
                borderRadius={0}
                paddingHorizontal="$3"
                paddingVertical="$2"
                justifyContent="flex-start"
                onPress={() => handleAddressSelect(address)}
                hoverStyle={{ backgroundColor: '$color5' }}
              >
                <Text fontSize="$3" numberOfLines={1}>
                  {address.formattedAddress}
                </Text>
              </Button>
            ))}
          </YStack>
        )}
      </YStack>
      <FieldError message={error} />
    </YStack>
  )
}

// Custom mock AddressForm for demo
const MockAddressForm = ({ mode, placeholder, error, disabled, onAddressSelect }: any) => {
  const [address, setAddress] = useState({
    streetAddress: '',
    locality: '',
    stateAbbreviation: '',
    postalCode: '',
    country: '',
  })

  const handleAutocompleteSelect = useCallback(
    (selectedAddress: any) => {
      setAddress({
        streetAddress: selectedAddress.streetAddress || '',
        locality: selectedAddress.locality || '',
        stateAbbreviation: selectedAddress.stateAbbreviation || '',
        postalCode: selectedAddress.postalCode || '',
        country: selectedAddress.country || '',
      })
      onAddressSelect?.(selectedAddress)
    },
    [onAddressSelect]
  )

  if (mode === 'autocomplete-only') {
    return (
      <MockAddressAutocomplete
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        onAddressSelect={handleAutocompleteSelect}
      />
    )
  }

  return (
    <YStack gap="$3">
      {mode === 'hybrid' && (
        <>
          <MockAddressAutocomplete
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            onAddressSelect={handleAutocompleteSelect}
          />
        </>
      )}

      <YStack gap="$2">
        <Input
          placeholder="Street address"
          value={address.streetAddress}
          onChangeText={(text) => setAddress((prev) => ({ ...prev, streetAddress: text }))}
          disabled={disabled}
        />

        <XStack gap="$2">
          <Input
            placeholder="City"
            value={address.locality}
            onChangeText={(text) => setAddress((prev) => ({ ...prev, locality: text }))}
            disabled={disabled}
            flex={1}
          />
          <Input
            placeholder="State"
            value={address.stateAbbreviation}
            onChangeText={(text) => setAddress((prev) => ({ ...prev, stateAbbreviation: text }))}
            disabled={disabled}
            flex={1}
          />
        </XStack>

        <XStack gap="$2">
          <Input
            placeholder="ZIP Code"
            value={address.postalCode}
            onChangeText={(text) => setAddress((prev) => ({ ...prev, postalCode: text }))}
            disabled={disabled}
            flex={1}
          />
          <Input
            placeholder="Country"
            value={address.country}
            onChangeText={(text) => setAddress((prev) => ({ ...prev, country: text }))}
            disabled={disabled}
            flex={2}
          />
        </XStack>
      </YStack>

      {error && <FieldError message={error} />}
    </YStack>
  )
}

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

          {/* Address Component Example */}
          <YStack gap="$4" width="100%">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$color">
                AddressAutocomplete (Demo Mode)
              </Text>
              <Text fontSize="$2" color="$color9">
                Try typing: "1600", "Apple", "Seattle", "New York", or "Menlo"
              </Text>
            </YStack>
            <MockAddressAutocomplete
              value={addressSearch}
              onChange={setAddressSearch}
              onAddressSelect={(address: any) => {
                setAddressSearch(address.formattedAddress)
                console.log('Selected address:', address)
              }}
              placeholder="Search for an address..."
              error={addressError}
              disabled={addressDisabled}
            />

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$color">
                AddressForm ({addressMode}) - Demo Mode
              </Text>
              <Text fontSize="$2" color="$color9">
                {addressMode === 'hybrid'
                  ? 'Includes autocomplete search + manual fields'
                  : addressMode === 'autocomplete-only'
                    ? 'Search only - no manual input fields'
                    : 'Manual input fields only'}
              </Text>
            </YStack>
            <MockAddressForm
              mode={addressMode}
              placeholder="Search for your address..."
              error={addressError}
              disabled={addressDisabled}
              onAddressSelect={(address: any) => {
                console.log('Selected address from form:', address)
              }}
            />
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

            <MockAddressForm mode="hybrid" placeholder="Enter your address..." />

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
