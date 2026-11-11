import { useDebounce } from '@scf/core/utils/useDebounce'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { useSearchOccupations } from '@scf/core/utils/onet-sdk-hooks'
import type { Occupation as SDKOccupation } from '@scaffald/sdk'
import { useEffect, useId, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AnchoredOverlay,
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
  const anchorRef = useRef<View>(null)
  const listboxId = `occupation-results-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

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
  const showError = showResults && debouncedSearch.length >= 2 && !!queryError
  const showEmpty =
    showResults && debouncedSearch.length >= 2 && !isLoading && occupations.length === 0 && !queryError
  const menuOpen = showDropdown || showError || showEmpty
  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: showDropdown ? occupations.length : 0,
    open: menuOpen,
    onSelectIndex: (index) => {
      const occupation = occupations[index]
      if (occupation) handleSelect(occupation)
    },
    onClose: () => setShowResults(false),
  })

  return (
    <Stack gap={8} width="100%" style={{ position: 'relative' }}>
      <View ref={anchorRef}>
        <Row gap={8} align="center">
          <Input
            style={{ flex: 1 }}
            placeholder={placeholder}
            value={searchTerm}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            {...nav.inputProps}
          />
          {isLoading && <Spinner variant="ios" size="sm" />}
        </Row>
      </View>

      {/* Results, error or "no occupations" — portalled above the page on web (#1330) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={menuOpen}
        onRequestClose={() => setShowResults(false)}
        maxHeight={300}
        {...nav.listboxProps}
      >
        {showDropdown ? (
          occupations.map((occupation: SDKOccupation, index: number) => {
            const { onetCode, title } = toDisplayOcc(occupation)
            return (
              <Pressable
                key={onetCode}
                onPress={() => handleSelect(occupation)}
                {...nav.getOptionProps(index)}
                style={({ pressed }) =>
                  getMenuItemStyle(t, { active: nav.activeIndex === index, pressed })
                }
              >
                <Row gap={8}>
                  <Stack style={{ flex: 1 }} gap={4}>
                    <Text>{title}</Text>
                    <Text style={{ color: colors.text[t].secondary }}>{onetCode}</Text>
                  </Stack>
                </Row>
              </Pressable>
            )
          })
        ) : showError ? (
          <Stack padding="sm">
            <Text style={{ color: colors.error[t === 'light' ? 700 : 300] }}>
              {queryError?.message || 'Unable to load occupations. Please try again.'}
            </Text>
          </Stack>
        ) : (
          <Stack padding="sm">
            <Text style={{ color: colors.text[t].secondary }}>
              No occupations found for "{debouncedSearch}"
            </Text>
          </Stack>
        )}
      </AnchoredOverlay>
    </Stack>
  )
}
