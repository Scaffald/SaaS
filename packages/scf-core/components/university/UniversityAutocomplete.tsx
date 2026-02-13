import { useCallback, useEffect, useState } from 'react'
import { Input, Text, Stack, Spinner } from '@scaffald/ui'
import { Pressable, ScrollView, StyleSheet } from 'react-native'

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

const MIN_SEARCH_LENGTH = 3

/**
 * University Autocomplete Component
 *
 * Provides autocomplete search for universities from catalog.
 * Defaults to US universities with minimum 3 character search.
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
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const isControlled = controlledInputValue !== undefined
  const displayValue = isControlled ? controlledInputValue : inputValue

  const handleInputChange = useCallback(
    (text: string) => {
      if (!isControlled) setInputValue(text)
      onInputChange?.(text)
      if (text.trim().length >= MIN_SEARCH_LENGTH) {
        onSearch(text)
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    },
    [isControlled, onSearch, onInputChange]
  )

  const handleSelect = useCallback(
    (university: University) => {
      if (!isControlled) setInputValue(university.name)
      onUniversitySelect?.(university)
      onChange?.(university.name)
      setIsOpen(false)
    },
    [isControlled, onUniversitySelect, onChange]
  )

  useEffect(() => {
    if (!isControlled && value !== inputValue) {
      setInputValue(value)
    }
  }, [value, isControlled, inputValue])

  const errorMessage = error || searchError
  const showDropdown = isOpen && displayValue.trim().length >= MIN_SEARCH_LENGTH

  return (
    <Stack gap={4} style={styles.container}>
      <Input
        value={displayValue}
        onChangeText={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        error={!!errorMessage}
        helperText={errorMessage}
        onFocus={() => displayValue.trim().length >= MIN_SEARCH_LENGTH && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{ flex: 1 }}
      />
      {showDropdown && (
        <Stack style={styles.dropdown}>
          {loading ? (
            <Stack padding="md" align="center">
              <Spinner size="sm" />
            </Stack>
          ) : results.length === 0 ? (
            <Stack padding="md">
              <Text size="sm" color="secondary">
                No results found
              </Text>
            </Stack>
          ) : (
            <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
              {results.map((uni) => (
                <Pressable
                  key={uni.id}
                  onPress={() => handleSelect(uni)}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <Stack gap={2}>
                    <Text size="sm">{uni.name}</Text>
                    {uni.country && (
                      <Text size="sm" color="secondary">
                        {uni.country}
                      </Text>
                    )}
                  </Stack>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Stack>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    maxHeight: 250,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  resultsList: {
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  optionPressed: {
    backgroundColor: '#f4f4f5',
  },
})
