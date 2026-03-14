import { X } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { Button, Card, Input, ScrollView, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
}: SimpleSkillAutocompleteProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [results, setResults] = useState<ParentSkill[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedValue = useDebounceValue(value, 300)
  const [showResults, setShowResults] = useState(false)

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
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
        if (isMounted) {
          setResults([])
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
  }, [debouncedValue])

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

  return (
    <Stack gap={8} style={{ zIndex: 1000 }}>
      <Stack style={{ position: 'relative' }}>
        <Input
          value={value}
          onChangeText={(text) => {
            onChangeText(text)
            if (text.length >= 2) setShowResults(true)
          }}
          placeholder={placeholder}
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
      </Stack>

      {/* Results Dropdown */}
      {showResults && (value.length >= 2 || results.length > 0) && (
        <Card
          bordered
          elevate
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 300, zIndex: 2000 }}
        >
          <ScrollView>
            <Stack>
              {isLoading || isSearching ? (
                <Stack padding="md" align="center" justify="center">
                  <Spinner size="sm" />
                  <Text style={{ color: colors.text[t].secondary, marginTop: 8 }}>
                    Searching...
                  </Text>
                </Stack>
              ) : results.length > 0 ? (
                results.map((skill) => {
                  const isExisting = existingSkillIds.includes(skill.id)
                  return (
                    <Pressable
                      key={skill.id}
                      onPress={() => handleSelect(skill)}
                      style={{ opacity: isExisting ? 0.6 : 1, borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
                    >
                    <Stack
                      padding="sm"
                    >
                      <Row justify="space-between" align="center">
                        <Stack flex={1}>
                          <Text>{skill.name}</Text>
                          {skill.code && <Text style={{ color: colors.text[t].secondary }}>{skill.code}</Text>}
                        </Stack>
                        {isExisting && <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[600] }}>Added</Text>}
                      </Row>
                    </Stack>
                    </Pressable>
                  )
                })
              ) : (
                <Stack padding="md" align="center">
                  <Text style={{ color: colors.text[t].secondary }}>No skills found</Text>
                </Stack>
              )}
            </Stack>
          </ScrollView>
        </Card>
      )}
    </Stack>
  )
}
