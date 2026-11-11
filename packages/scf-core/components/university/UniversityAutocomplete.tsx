import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  AnchoredOverlay,
  Input,
  Text,
  Stack,
  Spinner,
  getMenuItemStyle,
  useListboxNavigation,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Pressable, View } from 'react-native'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const anchorRef = useRef<View>(null)
  const listboxId = `university-results-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
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
  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: loading ? 0 : results.length,
    open: showDropdown,
    onSelectIndex: (index) => {
      const university = results[index]
      if (university) handleSelect(university)
    },
    onClose: () => setIsOpen(false),
  })

  return (
    <Stack gap={4} style={styles.container}>
      <View ref={anchorRef}>
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
          {...nav.inputProps}
        />
      </View>
      {/* Results menu — portalled above the page on web (#1330) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={showDropdown}
        onRequestClose={() => setIsOpen(false)}
        maxHeight={250}
        {...nav.listboxProps}
      >
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
          results.map((uni, index) => (
            <Pressable
              key={uni.id}
              onPress={() => handleSelect(uni)}
              {...nav.getOptionProps(index)}
              style={({ pressed }) => [
                getMenuItemStyle(t, { active: nav.activeIndex === index, pressed }),
                { borderBottomWidth: 1, borderBottomColor: colors.bg[t].subtle },
              ]}
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
          ))
        )}
      </AnchoredOverlay>
    </Stack>
  )
}

const styles = {
  container: {
    position: 'relative' as const,
  },
}
