import {
  formatPhoneNumber,
  getE164Format,
  getPhoneRegionCode,
  isValidPhoneNumber,
} from '../../types/phone'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Adapt, Input, Select, Text, useWindowDimensions, XStack, YStack } from 'tamagui'
import {
  COUNTRIES,
  type Country,
  findCountryByCode,
  getDefaultCountry,
} from '../../config/countries'
import { FieldError } from '../FieldError'
import { Sheet } from '../sheets/Sheet'

const DEBOUNCE_DELAY_MS = 500
const PHONE_INVALID_MESSAGE = 'Please enter a valid phone number'

export interface PhoneNumberInputProps {
  /** Current phone number value */
  value?: string
  /** Callback when phone number changes */
  onChange?: (value: string) => void
  /** Placeholder text for the input */
  placeholder?: string
  /** Error message to display */
  error?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Default country code */
  defaultCountry?: string
  /** Whether to store formatted or unformatted phone number */
  storeFormatted?: boolean
  /** Custom country list (overrides default) */
  countries?: Country[]
}

/**
 * Phone number input component with country selection
 *
 * Features:
 * - Country selection with flags and dial codes
 * - Real-time phone number formatting
 * - Validation using awesome-phonenumber
 * - Cross-platform compatibility (web, iOS, Android)
 * - Integration with react-hook-form and Zod
 *
 * @example
 * ```tsx
 * <PhoneNumberInput
 *   value={phone}
 *   onChange={setPhone}
 *   defaultCountry="US"
 *   error={errors.phone?.message}
 * />
 * ```
 */
export const PhoneNumberInput = ({
  value = '',
  onChange,
  placeholder = 'Phone number',
  error,
  disabled = false,
  defaultCountry = 'US',
  storeFormatted = false,
  countries = COUNTRIES,
}: PhoneNumberInputProps) => {
  // Use window dimensions for conditional rendering
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isMobile = width <= 800

  // Helper function to format phone number for display
  const formatPhoneForDisplay = useCallback((phoneValue: string, countryCode: string) => {
    if (!phoneValue) {
      return ''
    }

    const trimmed = phoneValue.trim()
    const detectedRegion = getPhoneRegionCode(trimmed) ?? countryCode

    if (isValidPhoneNumber(trimmed, detectedRegion)) {
      return formatPhoneNumber(trimmed, detectedRegion)
    }

    if (detectedRegion === 'US' && /^\d{10}$/.test(trimmed)) {
      const area = trimmed.slice(0, 3)
      const exchange = trimmed.slice(3, 6)
      const line = trimmed.slice(6)
      return `+1 (${area}) ${exchange}-${line}`
    }

    return trimmed
  }, [])

  const [selectedCountry, setSelectedCountry] = useState<Country>(
    findCountryByCode(defaultCountry) || getDefaultCountry()
  )
  const [phoneNumber, setPhoneNumber] = useState(() =>
    formatPhoneForDisplay(value ?? '', defaultCountry)
  )
  const [internalError, setInternalError] = useState<string | undefined>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSubmittedValue = useRef<string>('')
  const resolvedError = error ?? internalError

  // Update internal state when external value changes
  useEffect(() => {
    if (value === undefined) {
      return
    }

    const detectedRegion = getPhoneRegionCode(value ?? '') ?? selectedCountry.code
    const detectedCountry = findCountryByCode(detectedRegion)

    if (detectedCountry && detectedCountry.code !== selectedCountry.code) {
      setSelectedCountry(detectedCountry)
    }

    const formattedValue = formatPhoneForDisplay(value ?? '', detectedRegion)

    if (formattedValue !== phoneNumber) {
      setPhoneNumber(formattedValue)
    }

    if (!value) {
      setInternalError(undefined)
      lastSubmittedValue.current = ''
      return
    }

    if (isValidPhoneNumber(value, detectedRegion)) {
      setInternalError(undefined)
      const outbound = storeFormatted ? formattedValue : getE164Format(value, detectedRegion)
      lastSubmittedValue.current = outbound
    } else {
      setInternalError(PHONE_INVALID_MESSAGE)
      lastSubmittedValue.current = value
    }
  }, [value, phoneNumber, formatPhoneForDisplay, selectedCountry.code, storeFormatted])

  const handleCountryChange = useCallback(
    (countryCode: string) => {
      const country = findCountryByCode(countryCode)
      if (country) {
        setSelectedCountry(country)
        // Clear phone number when country changes to avoid confusion
        setPhoneNumber('')
        onChange?.('')
        setInternalError(undefined)
        lastSubmittedValue.current = ''
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
      }
    },
    [onChange]
  )

  const handlePhoneChange = useCallback(
    (text: string) => {
      setPhoneNumber(text)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        const trimmed = text.trim()

        if (!trimmed) {
          setInternalError(undefined)
          lastSubmittedValue.current = ''
          onChange?.('')
          return
        }

        const detectedRegion = getPhoneRegionCode(trimmed) ?? selectedCountry.code
        const detectedCountry = findCountryByCode(detectedRegion)

        if (detectedCountry && detectedCountry.code !== selectedCountry.code) {
          setSelectedCountry(detectedCountry)
        }

        if (isValidPhoneNumber(trimmed, detectedRegion)) {
          const formatted = formatPhoneForDisplay(trimmed, detectedRegion)
          setPhoneNumber(formatted)
          setInternalError(undefined)
          const outbound = storeFormatted ? formatted : getE164Format(trimmed, detectedRegion)

          if (lastSubmittedValue.current !== outbound) {
            lastSubmittedValue.current = outbound
            onChange?.(outbound)
          }
        } else {
          setInternalError(PHONE_INVALID_MESSAGE)

          if (lastSubmittedValue.current !== trimmed) {
            lastSubmittedValue.current = trimmed
            onChange?.(trimmed)
          }
        }
      }, DEBOUNCE_DELAY_MS)
    },
    [formatPhoneForDisplay, onChange, selectedCountry.code, storeFormatted]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <YStack gap="$2">
      {/* Phone input container with absolute positioned country selector */}
      <YStack position="relative">
        {/* Main phone input field */}
        <Input
          placeholder={placeholder}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          borderColor={resolvedError ? '$red8' : '$borderColor'}
          disabled={disabled}
          inputMode="tel"
          pl={50} // Make space for country selector
          pr="$3"
          py="$3"
          focusStyle={{
            borderColor: '$blue7',
            outlineColor: '$blue7',
            outlineWidth: 2,
          }}
        />

        {/* Country Selector - absolutely positioned */}
        <YStack
          l={4}
          position="absolute"
          width={78}
          height="calc(100% - 2px)"
          bg="transparent"
          style={{ pointerEvents: disabled ? 'none' : 'auto' }}
        >
          <Select value={selectedCountry.code} onValueChange={handleCountryChange} size="$4">
            <Select.Trigger
              borderWidth={0}
              bg="transparent"
              hoverStyle={{ backgroundColor: 'transparent', transform: 'scale(1.5)' }}
              px="$3"
              py="$2"
              opacity={disabled ? 0.5 : 1}
              width={40}
            >
              <Select.Value>
                <Text fontSize="$4">{selectedCountry.flag}</Text>
              </Select.Value>
            </Select.Trigger>

            <Adapt when={isMobile} platform="touch">
              <Sheet
                native
                modal
                dismissOnSnapToBottom
                animationConfig={{
                  type: 'spring',
                  damping: 20,
                  mass: 1.2,
                  stiffness: 250,
                }}
              >
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay
                  animation="lazy"
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>

            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                {countries.map((country, index) => (
                  <Select.Item key={country.code} value={country.code} index={index}>
                    <XStack items="center" gap="$2">
                      <Text fontSize="$3">{country.flag}</Text>
                      <Text fontSize="$3">{country.dialCode}</Text>
                      <Text fontSize="$3">{country.name}</Text>
                    </XStack>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>
      </YStack>

      <FieldError message={resolvedError} />
    </YStack>
  )
}
