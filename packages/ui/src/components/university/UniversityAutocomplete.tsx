import { useCallback, useMemo } from 'react'
import { YStack, Text } from 'tamagui'
import { SearchSelect, type SearchSelectOption } from '../search-select'

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
  // Convert University[] to SearchSelectOption<University>[]
  const options = useMemo<SearchSelectOption<University>[]>(
    () =>
      results.map((university) => ({
        id: university.id,
        label: university.name,
        value: university,
        searchableText: `${university.name} ${university.country}`,
      })),
    [results]
  )

  // Handle selection
  const handleSelect = useCallback(
    (option: SearchSelectOption<University> | null) => {
      if (option) {
        onUniversitySelect?.(option.value)
        onChange?.(option.value.name)
      } else {
        onChange?.('')
      }
    },
    [onUniversitySelect, onChange]
  )

  // Custom render function for university results
  const renderOption = useCallback(
    (option: SearchSelectOption<University>) => (
      <YStack items="flex-start" gap="$1">
        <Text fontSize="$3" color="$color12" numberOfLines={1} fontWeight="600">
          {option.value.name}
        </Text>
        <Text fontSize="$2" color="$color11" numberOfLines={1}>
          {option.value.country}
        </Text>
      </YStack>
    ),
    []
  )

  return (
    <SearchSelect<University>
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      options={options}
      onSearch={onSearch}
      loading={loading}
      error={error || searchError || undefined}
      disabled={disabled}
      placeholder={placeholder}
      minSearchLength={3}
      renderOption={renderOption}
    />
  )
}
