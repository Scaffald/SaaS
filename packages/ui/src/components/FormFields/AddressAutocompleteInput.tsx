import { forwardRef, useCallback, useId, useState } from 'react'
import {
  AnimatePresence,
  Button,
  Input,
  InputProps,
  Label,
  ScrollView,
  Text,
  Theme,
  View,
  XStack,
  YStack,
} from 'tamagui'
import { MapPin } from '@tamagui/lucide-icons'

import {
  useAddressAutocomplete,
  UseAddressAutocompleteOptions,
} from '../../hooks/useAddressAutocomplete'
import type { AddressSuggestion } from '../../utils/mapboxGeocoding'

export interface AddressAutocompleteInputProps extends Omit<InputProps, 'onChangeText' | 'value'> {
  value?: string
  onChangeText?: (value: string) => void
  onAddressSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  showSuggestions?: boolean
  maxSuggestions?: number
  autocompleteOptions?: UseAddressAutocompleteOptions
  variant?: 'default' | 'compact' | 'expanded' | 'clean'
  showFullAddress?: boolean
}

export const AddressAutocompleteInput = forwardRef<HTMLInputElement, AddressAutocompleteInputProps>(
  (
    {
      value = '',
      onChangeText,
      onAddressSelect,
      placeholder = 'Enter an address...',
      label,
      error,
      disabled = false,
      showSuggestions = true,
      maxSuggestions = 5,
      autocompleteOptions = {},
      variant = 'default',
      showFullAddress = false,
      ...inputProps
    },
    ref
  ) => {
    const id = useId()
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)

    const {
      suggestions,
      isLoading,
      error: searchError,
      search,
      clearSuggestions,
      selectSuggestion,
    } = useAddressAutocomplete({
      ...autocompleteOptions,
      onSelect: (suggestion) => {
        const displayValue = showFullAddress ? suggestion.fullAddress : suggestion.displayName
        setInputValue(displayValue)
        onChangeText?.(displayValue)
        onAddressSelect?.(suggestion)
        setIsOpen(false)
      },
      onError: (error) => {
        console.warn('Address autocomplete error:', error)
      },
    })

    const handleInputChange = useCallback(
      (text: string) => {
        setInputValue(text)
        onChangeText?.(text)

        if (text.trim().length >= 2) {
          search(text)
          setIsOpen(true)
        } else {
          clearSuggestions()
          setIsOpen(false)
        }
      },
      [onChangeText, search, clearSuggestions]
    )

    const handleInputFocus = useCallback(() => {
      if (suggestions.length > 0) {
        setIsOpen(true)
      }
    }, [suggestions.length])

    const handleInputBlur = useCallback(() => {
      // Delay closing to allow suggestion selection
      setTimeout(() => setIsOpen(false), 150)
    }, [])

    const handleSuggestionPress = useCallback(
      (suggestion: AddressSuggestion) => {
        selectSuggestion(suggestion)
      },
      [selectSuggestion]
    )

    const displaySuggestions = suggestions.slice(0, maxSuggestions)
    const hasError = error || searchError?.message

    // Variant-specific styling
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return {
            container: { gap: '$2' },
            input: { size: '$3', height: '$3' },
            suggestions: { maxHeight: 200 },
            showIcon: true,
          }
        case 'expanded':
          return {
            container: { gap: '$3' },
            input: { size: '$5', height: '$5' },
            suggestions: { maxHeight: 300 },
            showIcon: true,
          }
        case 'clean':
          return {
            container: { gap: 0 },
            input: { size: '$3', height: '100%', paddingHorizontal: '$3' },
            suggestions: { maxHeight: 240 },
            showIcon: false,
          }
        default:
          return {
            container: { gap: '$2' },
            input: { size: '$4', height: '$4' },
            suggestions: { maxHeight: 250 },
            showIcon: true,
          }
      }
    }

    const variantStyles = getVariantStyles()

    return (
      <Theme name={hasError ? 'red' : null} forceClassName>
        <YStack {...variantStyles.container}>
          {label && (
            <Label theme="alt1" size="$3" htmlFor={id}>
              {label}
            </Label>
          )}

          <View position="relative">
            <XStack position="relative" alignItems="center">
              <Input
                ref={ref}
                id={id}
                value={inputValue}
                onChangeText={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                disabled={disabled}
                placeholderTextColor="$color10"
                {...variantStyles.input}
                {...inputProps}
              />

              {variantStyles.showIcon && (
                <View position="absolute" right="$3" pointerEvents="none">
                  <MapPin size="$1" color="$color10" />
                </View>
              )}
            </XStack>

            {showSuggestions && isOpen && (
              <AnimatePresence>
                <View
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  zIndex={1000}
                  backgroundColor="$background"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$color5"
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 6 }}
                  shadowOpacity={0.2}
                  shadowRadius={16}
                  mt="$2"
                  overflow="hidden"
                >
                  <ScrollView maxHeight={variantStyles.suggestions.maxHeight}>
                    {displaySuggestions.length > 0 ? (
                      displaySuggestions.map((suggestion, index) => (
                        <Button
                          key={suggestion.id}
                          justifyContent="flex-start"
                          alignItems="flex-start"
                          padding="$4"
                          borderBottomWidth={index < displaySuggestions.length - 1 ? 1 : 0}
                          borderBottomColor="$color4"
                          backgroundColor="transparent"
                          minHeight="$5"
                          onPress={() => handleSuggestionPress(suggestion)}
                          hoverStyle={{ backgroundColor: '$color2' }}
                          pressStyle={{ backgroundColor: '$color3' }}
                        >
                          <XStack gap="$3" alignItems="flex-start" width="100%">
                            {variantStyles.showIcon && (
                              <MapPin size="$1.5" color="$color10" marginTop="$0.5" />
                            )}
                            <YStack flex={1} gap="$1.5">
                              <Text fontSize="$3" fontWeight="600" color="$color12" lineHeight="$4">
                                {suggestion.displayName}
                              </Text>
                              {suggestion.street && suggestion.city && (
                                <Text fontSize="$2.5" color="$color10" lineHeight="$3">
                                  {suggestion.street}, {suggestion.city}
                                  {suggestion.state && `, ${suggestion.state}`}
                                  {suggestion.zipCode && ` ${suggestion.zipCode}`}
                                </Text>
                              )}
                              {showFullAddress &&
                                suggestion.fullAddress !== suggestion.displayName && (
                                  <Text fontSize="$2.5" color="$color10" lineHeight="$3">
                                    {suggestion.fullAddress}
                                  </Text>
                                )}
                            </YStack>
                          </XStack>
                        </Button>
                      ))
                    ) : inputValue.length >= 2 && !isLoading ? (
                      <View padding="$4">
                        <Text fontSize="$3" color="$color10" textAlign="center">
                          No addresses found
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              </AnimatePresence>
            )}
          </View>

          {hasError && (
            <Text fontSize="$2" color="$red10">
              {error || searchError?.message}
            </Text>
          )}
        </YStack>
      </Theme>
    )
  }
)
