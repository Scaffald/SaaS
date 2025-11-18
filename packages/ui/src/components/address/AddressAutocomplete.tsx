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
  value: propsValue,
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
  // Determine if controlled or uncontrolled
  const isControlled = propsValue !== undefined
  const defaultValue = isControlled ? propsValue : ''

  // Internal state for uncontrolled mode
  const [stateInputValue, setStateInputValue] = useState(defaultValue)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Refs
  const inputRef = useRef<TextInput | null>(null)
  const resultsRef = useRef<ScrollView>(null)
  const isFocusedRef = useRef(false)
  const mounted = useRef(false)

  // Mounted tracking
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Determine current input value (controlled vs uncontrolled)
  const inputValue = isControlled ? (propsValue ?? '') : stateInputValue

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

  // Update internal state when uncontrolled value prop changes externally
  // (This handles the case where value prop is provided initially but component is uncontrolled)
  useEffect(() => {
    // Only sync if uncontrolled and value prop changed externally (not during editing)
    if (!isControlled && propsValue !== undefined && propsValue !== stateInputValue) {
      // Only update if not currently focused/editing to avoid conflicts
      if (!isFocusedRef.current && mounted.current) {
        setStateInputValue(propsValue)
      }
    }
  }, [isControlled, propsValue, stateInputValue])

  // Handle input changes
  const handleInputChange = useCallback(
    (text: string) => {
      if (!mounted.current) return

      // Update internal state if uncontrolled
      if (!isControlled) {
        setStateInputValue(text)
      }

      setSelectedIndex(-1)
      onChange?.(text)

      if (text.trim()) {
        search(text)
        // Only show results if focused
        if (isFocusedRef.current) {
          if (mounted.current) {
            setShowResults(true)
          }
        }
      } else {
        clearResults()
        if (mounted.current) {
          setShowResults(false)
        }
      }
    },
    [onChange, search, clearResults, isControlled]
  )

  // Handle address selection
  const handleAddressSelect = useCallback(
    (address: AddressResult) => {
      if (!mounted.current) return

      // Update internal state if uncontrolled
      if (!isControlled) {
        setStateInputValue(address.formattedAddress)
      }

      setShowResults(false)
      setSelectedIndex(-1)
      isFocusedRef.current = false
      onAddressSelect?.(address)
      onChange?.(address.formattedAddress)
      inputRef.current?.blur()
    },
    [onAddressSelect, onChange, isControlled]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: { nativeEvent: { key: string } }) => {
      if (!mounted.current || !showResults || results.length === 0) return

      const key = event.nativeEvent.key

      switch (key) {
        case 'ArrowDown':
          if (mounted.current) {
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          }
          break
        case 'ArrowUp':
          if (mounted.current) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          }
          break
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleAddressSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          if (mounted.current) {
            setShowResults(false)
            setSelectedIndex(-1)
            isFocusedRef.current = false
          }
          inputRef.current?.blur()
          break
      }
    },
    [showResults, results, selectedIndex, handleAddressSelect]
  )

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (!mounted.current) return
    isFocusedRef.current = true
    // Show results if we have them or are loading
    if (results.length > 0 || loading) {
      setShowResults(true)
    }
  }, [results.length, loading])

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    if (!mounted.current) return
    isFocusedRef.current = false
    // Use a small delay to allow for result selection via mouse/touch
    // But check mounted state before updating
    setTimeout(() => {
      if (mounted.current && !isFocusedRef.current) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }, [])

  // Clear input
  const handleClear = useCallback(() => {
    if (!mounted.current) return

    // Update internal state if uncontrolled
    if (!isControlled) {
      setStateInputValue('')
    }

    setShowResults(false)
    setSelectedIndex(-1)
    clearResults()
    onChange?.('')
    inputRef.current?.focus()
  }, [onChange, clearResults, isControlled])

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

  // Update showResults when results or loading state changes while focused
  useEffect(() => {
    if (!mounted.current) return

    if (isFocusedRef.current) {
      if (results.length > 0 || loading) {
        setShowResults(true)
      } else if (results.length === 0 && !loading) {
        // Only hide if we have no results and aren't loading
        setShowResults(false)
      }
    }
  }, [results.length, loading])

  const displayError = error || searchError
  const hasResults = results.length > 0
  const showDropdown = showResults && (hasResults || loading)

  return (
    <YStack gap="$2">
      {/* Universal Popover for all platforms */}
      <Popover
        placement="bottom-start"
        open={showDropdown}
        onOpenChange={(open) => {
          // Only allow Popover to close if input is not focused
          // This prevents Popover from closing when clicking outside while typing
          if (!open && !isFocusedRef.current) {
            setShowResults(false)
          }
        }}
      >
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
