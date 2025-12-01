import { useCallback, useMemo } from 'react'
import { SizableText, YStack } from 'tamagui'
import { SearchSelect, type SearchSelectOption } from '@unicornlove/ui'

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
  inputValue?: string
  onInputChange?: (value: string) => void
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
  inputValue: controlledInputValue,
  onInputChange,
}: UniversityAutocompleteProps) {
  // Handle input change - trigger search when input changes
  // Don't call onChange here to avoid loops - only sync on selection
  const handleInputChange = useCallback(
    (inputValue: string) => {
      // Only call onInputChange if we're not in controlled mode to avoid loops
      // When controlledInputValue is provided, SearchSelect manages the input value
      if (controlledInputValue === undefined) {
        onInputChange?.(inputValue)
      }
      if (inputValue.trim().length >= 3) {
        onSearch(inputValue)
      }
    },
    [onSearch, onInputChange, controlledInputValue]
  )

  // Handle selection
  const handleChange = useCallback(
    (university: University | University[] | null) => {
      if (university && !Array.isArray(university)) {
        onUniversitySelect?.(university)
        onChange?.(university.name)
      } else {
        onChange?.('')
      }
    },
    [onUniversitySelect, onChange]
  )

  // Find matching university from results if value matches
  const selectedUniversity = useMemo(() => {
    if (!value) return null
    return results.find((uni) => uni.name === value) || null
  }, [value, results])

  // Custom render function for university results
  const renderOption = useCallback(
    (option: SearchSelectOption<University>) => (
      <YStack gap="$1" flex={1} items="flex-start">
        <SizableText fontSize="$4" color="$color12" numberOfLines={1} fontWeight="600">
          {option.raw.name}
        </SizableText>
        {option.raw.country && (
          <SizableText fontSize="$2" color="$color11" numberOfLines={1}>
            {option.raw.country}
          </SizableText>
        )}
      </YStack>
    ),
    []
  )

  // If we have a value but it's not in results, and we have controlledInputValue,
  // use it to display the value in the input field
  // Otherwise, let SearchSelect manage the input value internally
  const inputValueToUse = controlledInputValue !== undefined ? controlledInputValue : undefined

  return (
    <SearchSelect<University>
      value={selectedUniversity}
      onChange={handleChange}
      onInputChange={handleInputChange}
      {...(inputValueToUse !== undefined ? { inputValue: inputValueToUse } : {})}
      options={results}
      getOptionLabel={(university) => university.name}
      getOptionValue={(university) => university.id}
      getOptionDescription={(university) => university.country}
      isLoading={loading}
      error={error || searchError || undefined}
      disabled={disabled}
      placeholder={placeholder}
      minSearchLength={3}
      enableFuzzyMatch={false}
      renderOption={renderOption}
    />
  )
}
