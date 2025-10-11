import { useState, useRef, useCallback, useEffect, memo } from 'react'
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

export interface University {
  id: string
  name: string
  country: string
  alpha_two_code: string
  slug: string
}

export interface UniversityAutocompleteProps {
  value?: string
  onUniversitySelect?: (university: University) => void
  onChange?: (text: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  onSearch: (query: string) => void
  results: University[]
  loading: boolean
  searchError?: string
}

/**
 * University Autocomplete Component
 *
 * Provides autocomplete search for universities from catalog.
 * Defaults to US universities with minimum 3 character search.
 *
 * @example
 * ```tsx
 * <UniversityAutocomplete
 *   value={universityName}
 *   universityId={universityId}
 *   onUniversitySelect={(uni) => {
 *     setUniversityId(uni.id)
 *     setUniversityName(uni.name)
 *   }}
 *   onSearch={handleSearch}
 *   results={searchResults}
 *   loading={isSearching}
 * />
 * ```
 */
export function UniversityAutocomplete({
  value = '',
  onUniversitySelect,
  onChange,
  placeholder = 'Search for institution...',
  error,
  disabled = false,
  onSearch,
  results,
  loading,
  searchError,
}: UniversityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<TextInput | null>(null)

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

      if (text.trim().length >= 3) {
        onSearch(text)
        setShowResults(true)
      } else {
        setShowResults(false)
      }
    },
    [onChange, onSearch]
  )

  // Handle university selection
  const handleUniversitySelect = useCallback(
    (university: University) => {
      setInputValue(university.name)
      setShowResults(false)
      setSelectedIndex(-1)
      onUniversitySelect?.(university)
      onChange?.(university.name)
      inputRef.current?.blur()
    },
    [onUniversitySelect, onChange]
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
            handleUniversitySelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setShowResults(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [showResults, results, selectedIndex, handleUniversitySelect]
  )

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (results.length > 0 && inputValue.length >= 3) {
      setShowResults(true)
    }
  }, [results.length, inputValue.length])

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
    onChange?.('')
    inputRef.current?.focus()
  }, [onChange])

  // Result item component
  const ResultItem = memo(({ university, index }: { university: University; index: number }) => (
    <Button
      key={university.id}
      variant="outlined"
      bg={selectedIndex === index ? '$color5' : 'transparent'}
      borderWidth={0}
      rounded={0}
      px="$3"
      py="$3"
      justify="flex-start"
      onPress={() => handleUniversitySelect(university)}
      pressStyle={{ bg: '$color6' }}
      hoverStyle={{ bg: '$color5' }}
      unstyled
    >
      <YStack items="flex-start" gap="$1">
        <Text fontSize="$3" color="$color12" numberOfLines={1} fontWeight="600">
          {university.name}
        </Text>
        <Text fontSize="$2" color="$color11" numberOfLines={1}>
          {university.country}
        </Text>
      </YStack>
    </Button>
  ))

  const displayError = error || searchError
  const hasResults = results.length > 0
  const showDropdown = showResults && (hasResults || loading)

  return (
    <YStack gap="$2">
      {/* Popover for all platforms */}
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
          minW="$20"
          elevate
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          $sm={{
            minW: '90%',
            maxW: '95%',
            maxH: 250,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {hasResults ? (
              results.map((university, index) => (
                <>
                  <ResultItem key={university.id} university={university} index={index} />
                  {index < results.length - 1 && <Separator bg="$borderColor" />}
                </>
              ))
            ) : loading ? (
              <YStack p="$4" items="center">
                <Text color="$color11">Searching...</Text>
              </YStack>
            ) : inputValue.length > 0 && inputValue.length < 3 ? (
              <YStack p="$4" items="center">
                <Text color="$color11">Type at least 3 characters to search</Text>
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
