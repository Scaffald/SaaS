import { X } from '@tamagui/lucide-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Input, ScrollView, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
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
    <YStack gap="$2" style={{ zIndex: 1000 }}>
      <YStack position="relative">
        <Input
          value={value}
          onChangeText={(text) => {
            onChangeText(text)
            if (text.length >= 2) setShowResults(true)
          }}
          placeholder={placeholder}
          paddingRight={40}
          size="$4"
          borderColor="$borderColor"
          focusStyle={{ borderColor: '$blue9' }}
        />

        {value.length > 0 && (
          <Button
            position="absolute"
            right={4}
            top={4}
            bottom={4}
            size="$2"
            circular
            chromeless
            onPress={() => {
              onChangeText('')
              setShowResults(false)
            }}
            icon={X}
          />
        )}
      </YStack>

      {/* Results Dropdown */}
      {showResults && (value.length >= 2 || results.length > 0) && (
        <Card
          bordered
          elevate
          position="absolute"
          top="100%"
          left={0}
          right={0}
          marginTop={4}
          maxHeight={300}
          zIndex={2000}
          backgroundColor="$background"
        >
          <ScrollView>
            <YStack>
              {isLoading || isSearching ? (
                <YStack padding="$4" alignItems="center" justifyContent="center">
                  <Spinner size="small" />
                  <Text fontSize="$2" color="$color11" marginTop="$2">
                    Searching...
                  </Text>
                </YStack>
              ) : results.length > 0 ? (
                results.map((skill) => {
                  const isExisting = existingSkillIds.includes(skill.id)
                  return (
                    <YStack
                      key={skill.id}
                      padding="$3"
                      pressStyle={{ backgroundColor: '$backgroundHover' }}
                      onPress={() => handleSelect(skill)}
                      borderBottomWidth={1}
                      borderBottomColor="$borderColor"
                      opacity={isExisting ? 0.6 : 1}
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack flex={1}>
                          <Text fontWeight="600">{skill.name}</Text>
                          {skill.code && (
                            <Text fontSize="$2" color="$color11">
                              {skill.code}
                            </Text>
                          )}
                        </YStack>
                        {isExisting && (
                          <Text fontSize="$2" color="$blue9" fontWeight="600">
                            Added
                          </Text>
                        )}
                      </XStack>
                    </YStack>
                  )
                })
              ) : (
                <YStack padding="$4" alignItems="center">
                  <Text color="$color11">No skills found</Text>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </Card>
      )}
    </YStack>
  )
}
