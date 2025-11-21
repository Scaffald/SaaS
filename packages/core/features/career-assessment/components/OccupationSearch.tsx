import { api } from '@app/core/utils/api'
import { useDebounce } from '@app/core/utils/useDebounce'
import { useEffect, useRef, useState } from 'react'
import { Input, Spinner, Text, XStack, YStack } from 'tamagui'

interface OccupationSearchProps {
  value?: string
  onChange: (onetCode: string, title: string) => void
  placeholder?: string
  disabled?: boolean
}

interface Occupation {
  onetsoc_code: string
  title: string
}

/**
 * OccupationSearch Component
 *
 * Autocomplete search for O*NET occupations
 * Debounced search with dropdown results
 *
 * @param value - Current O*NET code selected
 * @param onChange - Callback when occupation is selected
 * @param placeholder - Input placeholder text
 * @param disabled - Whether input is disabled
 */
export function OccupationSearch({
  value,
  onChange,
  placeholder = 'Search for your occupation...',
  disabled = false,
}: OccupationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTitle, setSelectedTitle] = useState('')
  const [showResults, setShowResults] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const lastTrackedSearchRef = useRef<string>('') // Track last searched query to avoid duplicate tracking

  // Track occupation searches for engagement analytics
  const trackEventMutation = api.engagement.trackEvent.useMutation()

  // Search occupations
  const {
    data,
    isLoading,
    error: queryError,
  } = api.onet.searchOccupations.useQuery(
    {
      query: debouncedSearch,
      limit: 10,
    },
    {
      enabled: debouncedSearch.length >= 2,
    }
  )

  // Track occupation search when results are available
  useEffect(() => {
    // Only track if query is valid, has results, and hasn't been tracked yet
    if (
      debouncedSearch.length >= 2 &&
      data?.occupations &&
      data.occupations.length > 0 &&
      lastTrackedSearchRef.current !== debouncedSearch &&
      !isLoading
    ) {
      lastTrackedSearchRef.current = debouncedSearch

      try {
        trackEventMutation.mutate({
          eventType: 'occupation.searched',
          targetType: undefined,
          targetId: undefined,
          metadata: {
            query: debouncedSearch.trim(),
            results_count: data.occupations.length,
          },
        })
      } catch (error) {
        // Silent error handling - don't impact search functionality
        console.warn('Failed to track occupation search:', error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, data?.occupations, isLoading])

  // Get selected occupation title
  useEffect(() => {
    if (value && !selectedTitle) {
      // Try to find the title from current search results
      const occupation = data?.occupations?.find((occ: Occupation) => occ.onetsoc_code === value)
      if (occupation) {
        setSelectedTitle(occupation.title)
        setSearchTerm(occupation.title)
      }
    }
  }, [value, data, selectedTitle])

  const handleSelect = (occupation: Occupation) => {
    setSearchTerm(occupation.title)
    setSelectedTitle(occupation.title)
    setShowResults(false)
    onChange(occupation.onetsoc_code, occupation.title)
  }

  const handleInputChange = (text: string) => {
    setSearchTerm(text)
    setShowResults(true)
    if (!text) {
      setSelectedTitle('')
      onChange('', '')
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click on results
    setTimeout(() => setShowResults(false), 200)
  }

  const occupations = data?.occupations || []
  const showDropdown =
    showResults && debouncedSearch.length >= 2 && occupations.length > 0 && !queryError

  return (
    <YStack gap="$2" position="relative" width="100%">
      <XStack gap="$2" items="center">
        <Input
          flex={1}
          placeholder={placeholder}
          value={searchTerm}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
        />
        {isLoading && <Spinner size="small" />}
      </XStack>

      {showDropdown && (
        <YStack
          position="absolute"
          t="100%"
          l={0}
          r={0}
          mt="$1"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
          bg="$background"
          maxH={300}
          overflow="scroll"
          z={1000}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
        >
          {occupations.map((occupation: Occupation) => (
            <XStack
              key={occupation.onetsoc_code}
              p="$3"
              gap="$2"
              hoverStyle={{
                bg: '$backgroundHover',
              }}
              pressStyle={{
                bg: '$backgroundPress',
              }}
              cursor="pointer"
              onPress={() => handleSelect(occupation)}
            >
              <YStack flex={1} gap="$1">
                <Text fontSize="$3" fontWeight="600">
                  {occupation.title}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {occupation.onetsoc_code}
                </Text>
              </YStack>
            </XStack>
          ))}
        </YStack>
      )}

      {debouncedSearch.length >= 2 && queryError && (
        <YStack
          position="absolute"
          t="100%"
          l={0}
          r={0}
          mt="$1"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
          bg="$background"
          p="$3"
          z={1000}
        >
          <Text fontSize="$3" color="$red10">
            {queryError.message || 'Unable to load occupations. Please try again.'}
          </Text>
        </YStack>
      )}

      {debouncedSearch.length >= 2 && !isLoading && occupations.length === 0 && showResults && (
        <YStack
          position="absolute"
          t="100%"
          l={0}
          r={0}
          mt="$1"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
          bg="$background"
          p="$3"
          z={1000}
        >
          <Text fontSize="$3" color="$color11">
            No occupations found for "{debouncedSearch}"
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
