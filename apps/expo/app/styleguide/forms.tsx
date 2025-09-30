import { useState, useCallback } from 'react'
import type { SliderProps, SizeTokens } from 'tamagui'
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
  Slider,
  Switch,
  Label,
} from 'tamagui'
import {
  PhoneNumberInput,
  AddressAutocomplete,
  AddressForm,
  AvatarImagePicker,
  FieldError,
  ToggleCard,
} from '@app/ui'
import { Flag, MapPin, Shield, Car, Wifi, Bell } from '@tamagui/lucide-icons'

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

  // State for toggle cards
  const [usResident, setUsResident] = useState(false)
  const [usPassport, setUsPassport] = useState(true)
  const [securityEnabled, setSecurityEnabled] = useState(false)
  const [autoConnectWifi, setAutoConnectWifi] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [companyVehicle, setCompanyVehicle] = useState(false)
  const [toggleCardsDisabled, setToggleCardsDisabled] = useState(false)

  // State for sliders
  const [sliderValue, setSliderValue] = useState([50])
  const [sliderDisabled, setSliderDisabled] = useState(false)
  const [sliderMin, setSliderMin] = useState(0)
  const [sliderMax, setSliderMax] = useState(100)
  const [sliderStep, setSliderStep] = useState(1)

  // State for switches
  const [switchDisabled, setSwitchDisabled] = useState(false)
  const [switchSize, setSwitchSize] = useState<SizeTokens>('$3')
  const [basicSwitch, setBasicSwitch] = useState(false)
  const [notificationsSwitch, setNotificationsSwitch] = useState(true)
  const [darkModeSwitch, setDarkModeSwitch] = useState(false)

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

  // Slider Demo Component
  function SliderDemo() {
    return (
      <XStack height={200} items="center" gap="$8">
        <SimpleSlider height={200} orientation="vertical" />
        <SimpleSlider width={200} />
      </XStack>
    )
  }

  function SimpleSlider({ children, ...props }: SliderProps) {
    return (
      <Slider defaultValue={[50]} max={100} step={1} {...props}>
        <Slider.Track>
          <Slider.TrackActive />
        </Slider.Track>
        <Slider.Thumb size="$2" index={0} circular />
        {children}
      </Slider>
    )
  }

  // Switch Demo Components
  function SwitchDemo() {
    return (
      <YStack width={200} items="center" gap="$3">
        <XStack gap="$3" $xs={{ flexDirection: 'column' }}>
          <SwitchWithLabel size="$2" />
          <SwitchWithLabel size="$2" defaultChecked />
        </XStack>
        <XStack gap="$3" $xs={{ flexDirection: 'column' }}>
          <SwitchWithLabel size="$3" />
          <SwitchWithLabel size="$3" defaultChecked />
        </XStack>
        <XStack gap="$3" $xs={{ flexDirection: 'column' }}>
          <SwitchWithLabel size="$4" />
          <SwitchWithLabel size="$4" defaultChecked />
        </XStack>
      </YStack>
    )
  }

  function SwitchWithLabel(props: { size: SizeTokens; defaultChecked?: boolean }) {
    const id = `switch-${props.size.toString().slice(1)}-${props.defaultChecked ?? ''}`
    return (
      <XStack width={200} items="center" gap="$4">
        <Label minW={90} justify="flex-end" size={props.size} htmlFor={id}>
          {label}
        </Label>
        <Separator height={20} vertical />
        <Switch id={id} size={props.size} defaultChecked={props.defaultChecked}>
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack p="$4" gap="$8" items="center">
        <Text fontSize="$8" fontWeight="600" color="$color">
          Form Components Demo
        </Text>

        <Text fontSize="$4" color="$color10" text="center" maxWidth={400}>
          Interactive examples of all form components with different states and configurations
        </Text>

        {/* Basic Input Section */}
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Basic Input Fields
          </Text>

          {/* Input Size Selector */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <YStack gap="$3" flex={1}>
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
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Select Component
          </Text>

          {/* Select Controls */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <YStack gap="$3" flex={1}>
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
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Phone Number Input
          </Text>

          {/* Phone Country Selector */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Address Components
          </Text>

          {/* Address Mode Selector */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <YStack gap="$6" flex={1}>
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
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Avatar Image Picker
          </Text>

          {/* Avatar Size Selector */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
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
          <XStack gap="$2" flexWrap="wrap" justify="center">
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

        {/* Toggle Card Section */}
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Toggle Cards
          </Text>

          <YStack gap="$2" items="center">
            <Text fontSize="$4" color="$color10" text="center">
              Fat-finger friendly toggle components with icons and descriptions
            </Text>
            <Text fontSize="$3" color="$color9" text="center">
              Entire card is clickable • Optional expandable content • Cross-platform animations
            </Text>
          </YStack>

          {/* Toggle Card Controls */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
            <Button
              variant={toggleCardsDisabled ? 'outlined' : undefined}
              onPress={() => setToggleCardsDisabled(!toggleCardsDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
          </XStack>

          {/* Toggle Card Examples */}
          <YStack gap="$4" flex={1}>
            {/* Basic Toggle Cards */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Basic Toggle Cards
              </Text>
              <Text fontSize="$2" color="$color9">
                Simple on/off toggles with icon, title, and description
              </Text>

              <ToggleCard
                icon={<Flag size="$2" color="$color11" />}
                title="US Resident"
                description="I am a permanent resident of the United States"
                checked={usResident}
                onCheckedChange={setUsResident}
                disabled={toggleCardsDisabled}
                flex={1}
              />

              <ToggleCard
                icon={<MapPin size="$2" color="$color11" />}
                title="US Passport"
                description="I have a valid United States passport"
                checked={usPassport}
                onCheckedChange={setUsPassport}
                disabled={toggleCardsDisabled}
                flex={1}
              />
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Toggle Cards with Expanded Content */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Toggle Cards with Expanded Content
              </Text>
              <Text fontSize="$2" color="$color9">
                Shows additional fields when toggled on
              </Text>

              <ToggleCard
                icon={<Shield size="$2" color="$color11" />}
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                checked={securityEnabled}
                onCheckedChange={setSecurityEnabled}
                disabled={toggleCardsDisabled}
                flex={1}
                expandedContent={
                  <YStack gap="$3" paddingTop="$2">
                    <Text fontSize="$3" fontWeight="500" color="$color11">
                      Authentication Method
                    </Text>
                    <YStack gap="$2">
                      <Button size="$3" variant="outlined">
                        <Text fontSize="$3">📱 SMS Text Message</Text>
                      </Button>
                      <Button size="$3" variant="outlined">
                        <Text fontSize="$3">📧 Email Verification</Text>
                      </Button>
                      <Button size="$3" variant="outlined">
                        <Text fontSize="$3">🔑 Authenticator App</Text>
                      </Button>
                    </YStack>
                  </YStack>
                }
              />

              <ToggleCard
                icon={<Wifi size="$2" color="$color11" />}
                title="Auto-Connect to WiFi"
                description="Automatically connect to known wireless networks"
                checked={autoConnectWifi}
                onCheckedChange={setAutoConnectWifi}
                disabled={toggleCardsDisabled}
                flex={1}
                expandedContent={
                  <YStack gap="$3" paddingTop="$2">
                    <Text fontSize="$3" fontWeight="500" color="$color11">
                      Network Preferences
                    </Text>
                    <Input placeholder="Preferred Network Name" size="$3" />
                    <Input placeholder="Network Password" secureTextEntry size="$3" />
                    <XStack gap="$2" justify="flex-end">
                      <Button size="$3">
                        <Text fontSize="$2">Save Network</Text>
                      </Button>
                    </XStack>
                  </YStack>
                }
              />
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Additional Examples */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Additional Examples
              </Text>
              <Text fontSize="$2" color="$color9">
                Various use cases and styling options
              </Text>

              <ToggleCard
                icon={<Bell size="$2" color="$color11" />}
                title="Push Notifications"
                description="Receive notifications on this device"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                disabled={toggleCardsDisabled}
                flex={1}
                expandedContent={
                  <YStack gap="$3" paddingTop="$2">
                    <Text fontSize="$3" fontWeight="500" color="$color11">
                      Notification Types
                    </Text>
                    <YStack gap="$2">
                      <XStack gap="$2" items="center">
                        <Text fontSize="$3">📬 New Messages</Text>
                      </XStack>
                      <XStack gap="$2" items="center">
                        <Text fontSize="$3">🎯 Job Matches</Text>
                      </XStack>
                      <XStack gap="$2" items="center">
                        <Text fontSize="$3">📊 Weekly Reports</Text>
                      </XStack>
                    </YStack>
                  </YStack>
                }
              />

              <ToggleCard
                icon={<Car size="$2" color="$color11" />}
                title="Company Vehicle Available"
                description="I have access to a company vehicle for work"
                checked={companyVehicle}
                onCheckedChange={setCompanyVehicle}
                disabled={toggleCardsDisabled}
                flex={1}
              />
            </YStack>
          </YStack>
        </YStack>

        <Separator width="80%" bg="$borderColor" />

        {/* Slider Section */}
        <YStack gap="$4" flex={1} maxW={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Slider Components
          </Text>

          <YStack gap="$2" items="center">
            <Text fontSize="$4" color="$color10" text="center">
              Interactive sliders for numeric input and range selection
            </Text>
            <Text fontSize="$3" color="$color9" text="center">
              Horizontal and vertical orientations • Customizable min/max/step • Cross-platform
            </Text>
          </YStack>

          {/* Slider Controls */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
            <Button
              variant={sliderDisabled ? 'outlined' : undefined}
              onPress={() => setSliderDisabled(!sliderDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button onPress={() => setSliderMin(sliderMin === 0 ? -50 : 0)} size="$3">
              <Text fontSize="$2">Min: {sliderMin}</Text>
            </Button>
            <Button onPress={() => setSliderMax(sliderMax === 100 ? 200 : 100)} size="$3">
              <Text fontSize="$2">Max: {sliderMax}</Text>
            </Button>
            <Button onPress={() => setSliderStep(sliderStep === 1 ? 5 : 1)} size="$3">
              <Text fontSize="$2">Step: {sliderStep}</Text>
            </Button>
          </XStack>

          {/* Slider Examples */}
          <YStack gap="$6" flex={1}>
            {/* Basic Slider */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Basic Slider
              </Text>
              <Text fontSize="$2" color="$color9">
                Current value: {sliderValue[0]}
              </Text>

              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={sliderMax}
                min={sliderMin}
                step={sliderStep}
                disabled={sliderDisabled}
                flex={1}
              >
                <Slider.Track>
                  <Slider.TrackActive />
                </Slider.Track>
                <Slider.Thumb size="$2" index={0} circular />
              </Slider>
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Horizontal vs Vertical Sliders */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Horizontal vs Vertical Sliders
              </Text>
              <Text fontSize="$2" color="$color9">
                Demonstration of different orientations
              </Text>

              <SliderDemo />
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Range Slider */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Range Slider (Dual Thumbs)
              </Text>
              <Text fontSize="$2" color="$color9">
                Select a range with two thumbs
              </Text>

              <Slider defaultValue={[25, 75]} max={100} step={1} disabled={sliderDisabled} flex={1}>
                <Slider.Track>
                  <Slider.TrackActive />
                </Slider.Track>
                <Slider.Thumb size="$2" index={0} circular />
                <Slider.Thumb size="$2" index={1} circular />
              </Slider>
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Custom Styled Slider */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Custom Styled Slider
              </Text>
              <Text fontSize="$2" color="$color9">
                Larger thumb and custom colors
              </Text>

              <Slider defaultValue={[60]} max={100} step={1} disabled={sliderDisabled} flex={1}>
                <Slider.Track backgroundColor="$color6" height={8}>
                  <Slider.TrackActive backgroundColor="$blue8" />
                </Slider.Track>
                <Slider.Thumb size="$3" index={0} circular backgroundColor="$blue9" />
              </Slider>
            </YStack>
          </YStack>
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Switch Section */}
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Switch Components
          </Text>

          <YStack gap="$2" items="center">
            <Text fontSize="$4" color="$color10" text="center">
              Toggle switches for on/off states and settings
            </Text>
            <Text fontSize="$3" color="$color9" text="center">
              Multiple sizes • Animated transitions • Accessible labels • Cross-platform
            </Text>
          </YStack>

          {/* Switch Controls */}
          <XStack gap="$2" flexWrap="wrap" justify="center">
            <Button
              variant={switchDisabled ? 'outlined' : undefined}
              onPress={() => setSwitchDisabled(!switchDisabled)}
              size="$3"
            >
              <Text fontSize="$2">Disabled</Text>
            </Button>
            <Button
              variant={switchSize === '$2' ? 'outlined' : undefined}
              onPress={() => setSwitchSize('$2')}
              size="$3"
            >
              <Text fontSize="$2">Small</Text>
            </Button>
            <Button
              variant={switchSize === '$3' ? 'outlined' : undefined}
              onPress={() => setSwitchSize('$3')}
              size="$3"
            >
              <Text fontSize="$2">Medium</Text>
            </Button>
            <Button
              variant={switchSize === '$4' ? 'outlined' : undefined}
              onPress={() => setSwitchSize('$4')}
              size="$3"
            >
              <Text fontSize="$2">Large</Text>
            </Button>
          </XStack>

          {/* Switch Examples */}
          <YStack gap="$6" flex={1}>
            {/* Basic Switches */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Basic Switches
              </Text>
              <Text fontSize="$2" color="$color9">
                Simple on/off toggles with labels
              </Text>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="basic-switch" size="$4">
                  Basic Switch
                </Label>
                <Switch
                  id="basic-switch"
                  checked={basicSwitch}
                  onCheckedChange={setBasicSwitch}
                  disabled={switchDisabled}
                  size={switchSize}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="notifications-switch" size="$4">
                  Push Notifications
                </Label>
                <Switch
                  id="notifications-switch"
                  checked={notificationsSwitch}
                  onCheckedChange={setNotificationsSwitch}
                  disabled={switchDisabled}
                  size={switchSize}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="dark-mode-switch" size="$4">
                  Dark Mode
                </Label>
                <Switch
                  id="dark-mode-switch"
                  checked={darkModeSwitch}
                  onCheckedChange={setDarkModeSwitch}
                  disabled={switchDisabled}
                  size={switchSize}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Size Comparison */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Size Comparison
              </Text>
              <Text fontSize="$2" color="$color9">
                Different sizes with consistent styling
              </Text>

              <SwitchDemo />
            </YStack>

            <Separator backgroundColor="$color6" />

            {/* Custom Styled Switches */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Custom Styled Switches
              </Text>
              <Text fontSize="$2" color="$color9">
                Switches with custom colors and animations
              </Text>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="custom-switch-1" size="$4">
                  Custom Blue
                </Label>
                <Switch
                  id="custom-switch-1"
                  disabled={switchDisabled}
                  size={switchSize}
                  backgroundColor="$blue8"
                >
                  <Switch.Thumb animation="quick" backgroundColor="$blue11" borderColor="$blue9" />
                </Switch>
              </XStack>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="custom-switch-2" size="$4">
                  Custom Green
                </Label>
                <Switch
                  id="custom-switch-2"
                  disabled={switchDisabled}
                  size={switchSize}
                  backgroundColor="$green8"
                >
                  <Switch.Thumb
                    animation="quick"
                    backgroundColor="$green11"
                    borderColor="$green9"
                  />
                </Switch>
              </XStack>

              <XStack gap="$4" items="center" justify="space-between">
                <Label htmlFor="custom-switch-3" size="$4">
                  Custom Purple
                </Label>
                <Switch
                  id="custom-switch-3"
                  disabled={switchDisabled}
                  size={switchSize}
                  backgroundColor="$purple8"
                >
                  <Switch.Thumb
                    animation="quick"
                    backgroundColor="$purple11"
                    borderColor="$purple9"
                  />
                </Switch>
              </XStack>
            </YStack>
          </YStack>
        </YStack>

        <Separator width="80%" backgroundColor="$borderColor" />

        {/* Form Patterns Section */}
        <YStack gap="$4" flex={1} maxWidth={500} items="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Form Patterns
          </Text>

          <Text fontSize="$4" color="$color10" text="center">
            Complete form examples combining multiple components
          </Text>

          {/* Sample Contact Form */}
          <YStack gap="$3" flex={1} p="$4" backgroundColor="$color2" rounded="$4">
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

            <XStack gap="$3" justify="flex-end">
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
        <YStack gap="$2" items="center" paddingTop="$6" paddingBottom="$4">
          <Text fontSize="$3" color="$color9" text="center">
            All form components are cross-platform compatible
          </Text>
          <Text fontSize="$2" color="$color8" text="center">
            Test on web, iOS, and Android for consistent behavior
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
