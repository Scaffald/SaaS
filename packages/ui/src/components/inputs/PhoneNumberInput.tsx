import React, { useState, useCallback, useEffect } from 'react'
import { XStack, YStack, Text, Select, Input, Adapt, Sheet } from 'tamagui'
import { FieldError } from '../FieldError'
import {
  COUNTRIES,
  type Country,
  findCountryByCode,
  getDefaultCountry,
} from '../../config/countries'
import PhoneNumber from 'awesome-phonenumber'

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
  // Helper function to format phone number for display
  const formatPhoneForDisplay = useCallback((phoneValue: string, countryCode: string) => {
    if (!phoneValue) return phoneValue

    // If the value is already formatted (contains parentheses or spaces), return as-is
    if (
      /\+1\s*\(\d{3}\)\s*\d{3}-\d{4}/.test(phoneValue) ||
      /\+1\s+\d{3}\s+\d{3}\s+\d{4}/.test(phoneValue)
    ) {
      return phoneValue
    }

    try {
      // First try to parse as-is
      let phone = new PhoneNumber(phoneValue)

      // If that fails and it's a US number without country code, try adding +1
      if (!phone.isValid() && countryCode === 'US' && /^\d{10}$/.test(phoneValue)) {
        phone = new PhoneNumber(`+1${phoneValue}`)
      }

      // If it's a 10-digit number for US, assume it's US
      if (!phone.isValid() && countryCode === 'US' && /^\d{10}$/.test(phoneValue)) {
        phone = new PhoneNumber(phoneValue, 'US')
      }

      if (phone.isValid()) {
        if (countryCode === 'US') {
          const national = phone.getNumber('national')
          return `+1 ${national}`
        }
        return phone.getNumber('international')
      }
    } catch {
      // If parsing fails, return original value
    }
    return phoneValue
  }, [])

  const [selectedCountry, setSelectedCountry] = useState<Country>(
    findCountryByCode(defaultCountry) || getDefaultCountry()
  )
  const [phoneNumber, setPhoneNumber] = useState(() => formatPhoneForDisplay(value, defaultCountry))

  // Update internal state when external value changes
  useEffect(() => {
    if (value !== phoneNumber) {
      // Try to detect country from the phone number and format it properly
      if (value) {
        try {
          let phone = new PhoneNumber(value)
          let detectedCountry: Country | undefined = undefined

          // If parsing fails and it's a 10-digit number, assume it's US
          if (!phone.isValid() && /^\d{10}$/.test(value)) {
            phone = new PhoneNumber(value, 'US')
            detectedCountry = findCountryByCode('US')
          } else if (phone.isValid()) {
            detectedCountry = findCountryByCode(phone.getRegionCode())
          }

          if (detectedCountry) {
            setSelectedCountry(detectedCountry)
            setPhoneNumber(formatPhoneForDisplay(value, detectedCountry.code))
          } else if (phone.isValid()) {
            setPhoneNumber(formatPhoneForDisplay(value, selectedCountry.code))
          } else {
            setPhoneNumber(value)
          }
        } catch {
          // If parsing fails, just use the raw value
          setPhoneNumber(value)
        }
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value, phoneNumber, formatPhoneForDisplay, selectedCountry.code])

  const handleCountryChange = useCallback(
    (countryCode: string) => {
      const country = findCountryByCode(countryCode)
      if (country) {
        setSelectedCountry(country)
        // Clear phone number when country changes to avoid confusion
        setPhoneNumber('')
        onChange?.('')
      }
    },
    [onChange]
  )

  const handlePhoneChange = useCallback(
    (text: string) => {
      // Remove non-numeric characters except +
      const cleaned = text.replace(/[^\d+]/g, '')

      try {
        // Try to format the phone number using awesome-phonenumber
        const phone = new PhoneNumber(cleaned, selectedCountry.code)

        if (phone.isValid()) {
          const formatted = formatPhoneForDisplay(cleaned, selectedCountry.code)
          setPhoneNumber(formatted)
          onChange?.(storeFormatted ? formatted : phone.getNumber('e164'))
        } else {
          // If not valid yet, still allow typing
          setPhoneNumber(cleaned)
          onChange?.(cleaned)
        }
      } catch {
        // If parsing fails, just store the cleaned input
        setPhoneNumber(cleaned)
        onChange?.(cleaned)
      }
    },
    [selectedCountry.code, onChange, storeFormatted, formatPhoneForDisplay]
  )

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
          borderColor={error ? '$red8' : '$borderColor'}
          disabled={disabled}
          inputMode="tel"
          pl={50} // Make space for country selector
          pr="$3"
          py="$3"
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
              borderWidth="0"
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

      <FieldError message={error} />
    </YStack>
  )
}
