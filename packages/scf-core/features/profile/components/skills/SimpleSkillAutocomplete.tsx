import { X } from 'lucide-react-native'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AnchoredOverlay,
  Button,
  Input,
  Spinner,
  Text,
  Row,
  Stack,
  getMenuItemStyle,
  useListboxNavigation,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { workerPalette } from '@scf/core/components/ui/styles'
import type { ParentSkill } from '../../types/profile-skills-types'

// Local debounce hook to avoid dependency issues
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface SimpleSkillAutocompleteProps {
  /** Current search input value */
  value: string
  /** Callback when search input changes */
  onChangeText: (text: string) => void
  /** Callback to perform search */
  onSearch: (query: string) => Promise<ParentSkill[]>
  /** Callback when skill is selected */
  onSelect: (skill: ParentSkill) => void
  /** Whether search is loading */
  isLoading?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Existing skill IDs to highlight or filter */
  existingSkillIds?: string[]
  /**
   * Opaque token that re-triggers the search when it changes (without the user
   * editing the query) — e.g. when the CSI/O*NET taxonomy filters toggle.
   */
  searchSignal?: string
}

/**
 * Simple Skill Autocomplete Component
 * Decoupled from SearchSelect and ResponsiveSelect to avoid infinite loops
 */
export function SimpleSkillAutocomplete({
  value,
  onChangeText,
  onSearch,
  onSelect,
  isLoading = false,
  placeholder = 'Search for a skill...',
  existingSkillIds = [],
  searchSignal,
}: SimpleSkillAutocompleteProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = workerPalette[t]
  const [results, setResults] = useState<ParentSkill[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedValue = useDebounceValue(value, 300)
  const [showResults, setShowResults] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const anchorRef = useRef<View>(null)
  const listboxId = `skill-results-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Use ref to store latest onSearch without causing re-renders
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Handle search
  useEffect(() => {
    let isMounted = true

    const performSearch = async () => {
      if (!debouncedValue || debouncedValue.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      try {
        const searchResults = await onSearchRef.current(debouncedValue)
        if (isMounted) {
          setResults(searchResults)
          setHasError(false)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
        if (isMounted) {
          setResults([])
          setHasError(true)
          setShowResults(true)
        }
      } finally {
        if (isMounted) {
          setIsSearching(false)
        }
      }
    }

    performSearch()

    return () => {
      isMounted = false
    }
    // searchSignal re-runs the search when taxonomy filters change mid-query.
  }, [debouncedValue, retryNonce, searchSignal])

  // Hide results when input is cleared
  useEffect(() => {
    if (!value) {
      setShowResults(false)
    }
  }, [value])

  const handleSelect = useCallback(
    (skill: ParentSkill) => {
      onSelect(skill)
      setShowResults(false)
      onChangeText('') // Clear input after selection
    },
    [onSelect, onChangeText]
  )

  const menuOpen = showResults && (value.length >= 2 || results.length > 0)
  const busy = isLoading || isSearching
  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: busy ? 0 : results.length,
    open: menuOpen,
    onSelectIndex: (index) => {
      const skill = results[index]
      if (skill) handleSelect(skill)
    },
    onClose: () => setShowResults(false),
  })

  return (
    <Stack gap={8}>
      <View ref={anchorRef} style={{ position: 'relative' }}>
        <Input
          value={value}
          onChangeText={(text) => {
            onChangeText(text)
            if (text.length >= 2) setShowResults(true)
          }}
          placeholder={placeholder}
          {...nav.inputProps}
        />

        {value.length > 0 && (
          <Button
            style={{ position: 'absolute', right: 4, top: 4, bottom: 4 }}
            size="sm"
            variant="text"
            onPress={() => {
              onChangeText('')
              setShowResults(false)
            }}
            iconStart={X}
          />
        )}
      </View>

      {/* Results menu — portalled above the page on web (#1330) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={menuOpen}
        onRequestClose={() => setShowResults(false)}
        maxHeight={300}
        {...nav.listboxProps}
      >
        <Stack>
          {busy ? (
            <Stack padding="md" align="center" justify="center">
              <Spinner variant="ios" size="sm" />
              <Text style={{ color: colors.text[t].secondary, marginTop: 8 }}>
                Searching...
              </Text>
            </Stack>
          ) : results.length > 0 ? (
            results.map((skill, index) => {
              const isExisting = existingSkillIds.includes(skill.id)
              return (
                <Pressable
                  key={skill.id}
                  onPress={() => handleSelect(skill)}
                  {...nav.getOptionProps(index)}
                  style={({ pressed }) => [
                    getMenuItemStyle(t, { active: nav.activeIndex === index, pressed }),
                    {
                      opacity: isExisting ? 0.6 : 1,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border[t].default,
                    },
                  ]}
                >
                  <Row justify="space-between" align="center">
                    <Stack flex={1}>
                      <Text>{skill.name}</Text>
                      {skill.code && (
                        <Text style={{ color: colors.text[t].secondary }}>{skill.code}</Text>
                      )}
                    </Stack>
                    {isExisting && <Text style={{ color: pal.accent }}>Added</Text>}
                  </Row>
                </Pressable>
              )
            })
          ) : hasError ? (
            <Stack padding="md" align="center" gap={8}>
              <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
                Couldn't load results. Check your connection and try again.
              </Text>
              <Button size="sm" variant="outline" onPress={() => setRetryNonce((n) => n + 1)}>
                Retry
              </Button>
            </Stack>
          ) : (
            <Stack padding="md" align="center">
              <Text style={{ color: colors.text[t].secondary }}>No skills found</Text>
            </Stack>
          )}
        </Stack>
      </AnchoredOverlay>
    </Stack>
  )
}
