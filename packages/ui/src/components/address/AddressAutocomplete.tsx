import { useState, useRef, useCallback, useEffect, useMemo, memo, Fragment } from 'react'
import type { TextInput } from 'react-native'
import {
  YStack,
  XStack,
  Input,
  Text,
  ScrollView,
  Button,
  Spinner,
  Separator,
  Popover,
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
  provider = 'mapbox',
  apiKey,
  searchOptions = {},
  zoomLevel,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
  containerProps = {},
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<TextInput | null>(null)
  const resultsRef = useRef<ScrollView>(null)

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
  // Only sync if the external value is different AND we're not currently editing
  useEffect(() => {
    if (value !== inputValue && !showResults) {
      setInputValue(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    (event: { nativeEvent: { key: string } }) => {
      if (!showResults || results.length === 0) return

      const key = event.nativeEvent.key

      switch (key) {
        case 'ArrowDown':
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleAddressSelect(results[selectedIndex])
          }
          break
        case 'Escape':
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
  const ResultItem = memo(({ address, index }: { address: AddressResult; index: number }) => (
    <Button
      key={address.id}
      variant="outlined"
      bg={selectedIndex === index ? '$color5' : 'transparent'}
      borderWidth={0}
      rounded={0}
      px="$3"
      py="$3"
      justify="flex-start"
      onPress={() => handleAddressSelect(address)}
      pressStyle={{ bg: '$color6' }}
      hoverStyle={{ bg: '$color5' }}
      unstyled
    >
      <YStack items="flex-start" gap="$1">
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
          {address.formattedAddress}
        </Text>
      </YStack>
    </Button>
  ))

  const displayError = error || searchError
  const hasResults = results.length > 0
  const showDropdown = showResults && (hasResults || loading)

  return (
    <YStack gap="$2">
      {/* Universal Popover for all platforms */}
      <Popover placement="bottom-start" open={showDropdown} onOpenChange={setShowResults}>
        <Popover.Trigger asChild>
          <XStack
            borderWidth={1}
            borderColor={displayError ? '$red8' : '$borderColor'}
            rounded="$4"
            bg="$background"
            pr="$2"
            items="center"
            focusStyle={{
              borderColor: '$color8',
            }}
            {...containerProps}
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
              bg="transparent"
              flex={1}
              fontSize="$4"
              px="$3"
              py="$3"
            />

            {/* Loading indicator */}
            {loading ? <Spinner size="small" color="$color10" mr="$2" /> : null}

            {/* Clear button */}
            {inputValue && !loading ? (
              <Button
                variant="outlined"
                size="$2"
                borderWidth={0}
                onPress={handleClear}
                disabled={disabled}
                circular
                mr="$1"
              >
                <Button.Text fontSize="$3" color="$color10">
                  ✕
                </Button.Text>
              </Button>
            ) : null}
          </XStack>
        </Popover.Trigger>

        <Popover.Content
          rounded="$4"
          p={0}
          maxH={300}
          width="100%"
          elevate
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          // Mobile-optimized sizing
          $sm={{
            width: '90%',
            maxW: '95%',
            maxH: 250,
          }}
        >
          <ScrollView ref={resultsRef} showsVerticalScrollIndicator={false}>
            {hasResults ? (
              results.map((address, index) => (
                <Fragment key={address.id}>
                  <ResultItem address={address} index={index} />
                  {index < results.length - 1 && <Separator bg="$borderColor" />}
                </Fragment>
              ))
            ) : loading ? (
              <YStack p="$4" items="center">
                <Text color="$color11">Searching...</Text>
              </YStack>
            ) : null}
          </ScrollView>
        </Popover.Content>
      </Popover>

      {/* Error Message */}
      <FieldError message={displayError || undefined} />
    </YStack>
  )
}
