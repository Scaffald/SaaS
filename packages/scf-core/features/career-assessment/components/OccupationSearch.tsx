import { useDebounce } from '@scf/core/utils/useDebounce'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { useSearchOccupations } from '@scf/core/utils/onet-sdk-hooks'
import type { Occupation as SDKOccupation } from '@scaffald/sdk'
import { useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { Input, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface OccupationSearchProps {
  value?: string
  onChange: (onetCode: string, title: string) => void
  placeholder?: string
  disabled?: boolean
}

/** Normalize API occupation to { onetCode, title } for display */
function toDisplayOcc(occ: SDKOccupation): { onetCode: string; title: string } {
  const code = (occ as { onet_code?: string }).onet_code ?? (occ as { onetsoc_code?: string }).onetsoc_code ?? ''
  return { onetCode: code, title: occ.title }
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTitle, setSelectedTitle] = useState('')
  const [showResults, setShowResults] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const lastTrackedSearchRef = useRef<string>('') // Track last searched query to avoid duplicate tracking

  // Track occupation searches for engagement analytics
  const trackEventMutation = useTrackEngagementMutation()

  // Search occupations
  const {
    data,
    isLoading,
    error: queryError,
  } = useSearchOccupations(
    { query: debouncedSearch, limit: 10 } as { query: string; limit?: number },
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
        const list = (data as { occupations?: SDKOccupation[] }).occupations ?? []
        trackEventMutation.mutate({
          eventType: 'occupation.searched',
          targetType: undefined,
          targetId: undefined,
          metadata: {
            query: debouncedSearch.trim(),
            results_count: list.length,
          },
        })
      } catch (error) {
        // Silent error handling - don't impact search functionality
        console.warn('Failed to track occupation search:', error)
      }
    }
  }, [debouncedSearch, data, isLoading, trackEventMutation.mutate, trackEventMutation])

  // Get selected occupation title
  useEffect(() => {
    if (value && !selectedTitle && data) {
      const list = (data as { occupations?: SDKOccupation[] }).occupations ?? (data as { data?: SDKOccupation[] }).data ?? []
      const occupation = list.find((occ: SDKOccupation) => (occ as { onet_code?: string }).onet_code === value || (occ as { onetsoc_code?: string }).onetsoc_code === value)
      if (occupation) {
        setSelectedTitle(occupation.title)
        setSearchTerm(occupation.title)
      }
    }
  }, [value, data, selectedTitle])

  const handleSelect = (occupation: SDKOccupation) => {
    const { onetCode, title } = toDisplayOcc(occupation)
    setSearchTerm(title)
    setSelectedTitle(title)
    setShowResults(false)
    onChange(onetCode, title)
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

  const occupations = (data as { occupations?: SDKOccupation[] } | undefined)?.occupations ?? (data as { data?: SDKOccupation[] } | undefined)?.data ?? []
  const showDropdown =
    showResults && debouncedSearch.length >= 2 && occupations.length > 0 && !queryError

  return (
    <Stack gap={8} width="100%" style={{ position: 'relative' }}>
      <Row gap={8} align="center">
        <Input
          style={{ flex: 1 }}
          placeholder={placeholder}
          value={searchTerm}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
        />
        {isLoading && <Spinner size="sm" />}
      </Row>

      {showDropdown && (
        <Stack
          gap={0}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            borderRadius: 12,
            backgroundColor: 'var(--color-background)',
            maxHeight: 300,
            overflow: 'scroll',
            zIndex: 1000,
            shadowColor: 'var(--color-shadow)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          {occupations.map((occupation: SDKOccupation) => {
            const { onetCode, title } = toDisplayOcc(occupation)
            return (
              <Pressable key={onetCode} onPress={() => handleSelect(occupation)}>
                <Row padding="sm" gap={8} style={{ cursor: 'pointer' }}>
                  <Stack style={{ flex: 1 }} gap={4}>
                    <Text>{title}</Text>
                    <Text style={{ color: colors.text[t].secondary }}>{onetCode}</Text>
                  </Stack>
                </Row>
              </Pressable>
            )
          })}
        </Stack>
      )}

      {debouncedSearch.length >= 2 && queryError && (
        <Stack
          padding="sm"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            borderRadius: 12,
            backgroundColor: 'var(--color-background)',
            zIndex: 1000,
          }}
        >
          <Text style={{ color: colors.error[t === 'light' ? 700 : 300] }}>
            {queryError.message || 'Unable to load occupations. Please try again.'}
          </Text>
        </Stack>
      )}

      {debouncedSearch.length >= 2 && !isLoading && occupations.length === 0 && showResults && (
        <Stack
          padding="sm"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            borderRadius: 12,
            backgroundColor: 'var(--color-background)',
            zIndex: 1000,
          }}
        >
          <Text style={{ color: colors.text[t].secondary }}>No occupations found for "{debouncedSearch}"</Text>
        </Stack>
      )}
    </Stack>
  )
}
