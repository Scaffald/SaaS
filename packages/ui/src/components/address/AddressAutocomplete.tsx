import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  YStack,
  XStack,
  Input,
  Text,
  ScrollView,
  Button,
  Spinner,
  Adapt,
  Sheet,
  Separator,
} from 'tamagui'
import { FieldError } from '../FieldError'
import { useAddressAutocomplete } from './hooks'
import type { AddressAutocompleteProps, AddressResult } from './types'

/**
 * Address Autocomplete Component
 *
 * Simple input with dropdown suggestions for address search.
 * Perfect for map search and quick address selection.
 *
 * @example
 * ```tsx
 * <AddressAutocomplete
 *   value={address}
 *   onAddressSelect={(address) => {
 *     setMapCenter({ lat: address.coordinates.lat, lng: address.coordinates.lng })
 *   }}
 *   zoomLevel="city"
 *   placeholder="Search for a city..."
 * />
 * ```
 */
export function AddressAutocomplete({
  value = '',
  onAddressSelect,
  onChange,
  placeholder = 'Search addresses...',
  error,
  disabled = false,
  provider = 'google',
  apiKey,
  searchOptions = {},
  zoomLevel,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<any>(null)
  const resultsRef = useRef<any>(null)

  // Memoize config to prevent recreation on every render
  const providerConfig = useMemo(() => {
    if (!apiKey) return undefined
    return {
      provider,
      apiKey,
      defaultCountry: 'US' as const,
    }
  }, [provider, apiKey])

  // Memoize searchOptions to prevent recreation on every render
  const memoizedSearchOptions = useMemo(() => {
    return {
      ...searchOptions,
      zoomLevel,
    }
  }, [searchOptions, zoomLevel])

  // Address autocomplete hook
  const {
    results,
    loading,
    error: searchError,
    search,
    clearResults,
  } = useAddressAutocomplete({
    config: providerConfig,
    searchOptions: memoizedSearchOptions,
    debounceMs,
    minLength,
    maxResults,
  })

  // Update input value when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
    }
  }, [value])

  // Handle input changes
  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      setSelectedIndex(-1)
      onChange?.(text)

      if (text.trim()) {
        search(text)
        setShowResults(true)
      } else {
        clearResults()
        setShowResults(false)
      }
    },
    [onChange, search, clearResults]
  )

  // Handle address selection
  const handleAddressSelect = useCallback(
    (address: AddressResult) => {
      setInputValue(address.formattedAddress)
      setShowResults(false)
      setSelectedIndex(-1)
      onAddressSelect?.(address)
      onChange?.(address.formattedAddress)
      inputRef.current?.blur()
    },
    [onAddressSelect, onChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: any) => {
      if (!showResults || results.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleAddressSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          setShowResults(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [showResults, results, selectedIndex, handleAddressSelect]
  )

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (results.length > 0) {
      setShowResults(true)
    }
  }, [results.length])

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay hiding results to allow for result selection
    setTimeout(() => {
      setShowResults(false)
      setSelectedIndex(-1)
    }, 150)
  }, [])

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('')
    setShowResults(false)
    setSelectedIndex(-1)
    clearResults()
    onChange?.('')
    inputRef.current?.focus()
  }, [onChange, clearResults])

  // Result item component
  const ResultItem = React.memo(({ address, index }: { address: AddressResult; index: number }) => (
    <Button
      key={address.id}
      variant="outlined"
      backgroundColor={selectedIndex === index ? '$color5' : 'transparent'}
      borderWidth={0}
      borderRadius={0}
      paddingHorizontal="$3"
      paddingVertical="$3"
      justifyContent="flex-start"
      onPress={() => handleAddressSelect(address)}
      pressStyle={{ backgroundColor: '$color6' }}
      hoverStyle={{ backgroundColor: '$color5' }}
      unstyled
    >
      <YStack alignItems="flex-start" gap="$1">
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
          {address.formattedAddress}
        </Text>
        {address.types.length > 0 && (
          <Text fontSize="$2" color="$color11" opacity={0.7}>
            {address.types[0].replace(/_/g, ' ')}
          </Text>
        )}
      </YStack>
    </Button>
  ))

  const displayError = error || searchError
  const hasResults = results.length > 0
  const showDropdown = showResults && (hasResults || loading)

  return (
    <YStack gap="$2">
      {/* Input Container */}
      <YStack position="relative">
        <XStack
          borderWidth={1}
          borderColor={displayError ? '$red8' : '$borderColor'}
          borderRadius="$4"
          backgroundColor="$background"
          paddingRight="$2"
          alignItems="center"
          focusStyle={{
            borderColor: '$color8',
          }}
        >
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyDown}
            disabled={disabled}
            borderWidth={0}
            backgroundColor="transparent"
            flex={1}
            fontSize="$4"
            paddingHorizontal="$3"
            paddingVertical="$3"
          />

          {/* Loading indicator */}
          {loading && <Spinner size="small" color="$color10" marginRight="$2" />}

          {/* Clear button */}
          {inputValue && !loading && (
            <Button
              variant="outlined"
              size="$2"
              borderWidth={0}
              onPress={handleClear}
              disabled={disabled}
              circular
              marginRight="$1"
            >
              <Button.Text fontSize="$3" color="$color10">
                ✕
              </Button.Text>
            </Button>
          )}
        </XStack>

        {/* Desktop Results Dropdown */}
        {showDropdown && (
          <Adapt when="sm" platform="web">
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
              maxHeight={300}
              zIndex={1000}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={5}
            >
              <ScrollView ref={resultsRef} showsVerticalScrollIndicator={false}>
                {hasResults ? (
                  results.map((address, index) => (
                    <React.Fragment key={address.id}>
                      <ResultItem address={address} index={index} />
                      {index < results.length - 1 && <Separator backgroundColor="$borderColor" />}
                    </React.Fragment>
                  ))
                ) : loading ? (
                  <YStack padding="$4" alignItems="center">
                    <Text color="$color11">Searching...</Text>
                  </YStack>
                ) : null}
              </ScrollView>
            </YStack>
          </Adapt>
        )}

        {/* Mobile Results Sheet */}
        {showDropdown && (
          <Adapt when="sm" platform="touch">
            <Sheet modal open={showDropdown} onOpenChange={setShowResults}>
              <Sheet.Overlay />
              <Sheet.Frame padding="$4" space="$4">
                <Sheet.Handle />
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600">
                    Address Suggestions
                  </Text>
                  <ScrollView maxHeight={400} showsVerticalScrollIndicator={false}>
                    {hasResults ? (
                      <YStack gap="$2">
                        {results.map((address, index) => (
                          <ResultItem key={address.id} address={address} index={index} />
                        ))}
                      </YStack>
                    ) : loading ? (
                      <YStack padding="$4" alignItems="center">
                        <Text color="$color11">Searching...</Text>
                      </YStack>
                    ) : null}
                  </ScrollView>
                </YStack>
              </Sheet.Frame>
            </Sheet>
          </Adapt>
        )}
      </YStack>

      {/* Error Message */}
      <FieldError message={displayError || undefined} />
    </YStack>
  )
}
