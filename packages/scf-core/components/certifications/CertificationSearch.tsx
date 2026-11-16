import { Award, Search } from 'lucide-react-native'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AnchoredOverlay,
  Input,
  Text,
  Row,
  Stack,
  getMenuItemStyle,
  useListboxNavigation,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface Certification {
  id: string
  slug: string
  title: string
  description: string | null
  depth: number
  sort_order: number
  parent_id: string | null
  parent_title: string | null
  parent_slug: string | null
}

interface CertificationSearchProps {
  onSelect: (certification: Certification) => void
  searchResults: Certification[]
  onSearchChange: (query: string) => void
  isLoading?: boolean
  selectedIds?: string[]
}

/**
 * Search component for certifications at all depth levels (0, 1, 2)
 * Provides autocomplete-style search with debouncing and hierarchical grouping
 */
export function CertificationSearch({
  onSelect,
  searchResults,
  onSearchChange,
  isLoading = false,
  selectedIds = [],
}: CertificationSearchProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const anchorRef = useRef<View>(null)
  const listboxId = `cert-results-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch) {
      onSearchChange(debouncedSearch)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [debouncedSearch, onSearchChange])

  const handleSelect = (cert: Certification) => {
    onSelect(cert)
    setSearchQuery('')
    setShowResults(false)
  }

  const filteredResults = searchResults.filter((cert) => !selectedIds.includes(cert.id))

  // Group results by parent category and depth
  const groupedResults = useMemo(() => {
    const groups: {
      depth0: Certification[]
      depth1ByParent: Record<string, Certification[]>
      depth2ByParent: Record<string, Certification[]>
    } = {
      depth0: [],
      depth1ByParent: {},
      depth2ByParent: {},
    }

    for (const cert of filteredResults) {
      if (cert.depth === 0) {
        groups.depth0.push(cert)
      } else if (cert.depth === 1) {
        const parentId = cert.parent_id || 'none'
        if (!groups.depth1ByParent[parentId]) {
          groups.depth1ByParent[parentId] = []
        }
        groups.depth1ByParent[parentId].push(cert)
      } else if (cert.depth === 2) {
        const parentId = cert.parent_id || 'none'
        if (!groups.depth2ByParent[parentId]) {
          groups.depth2ByParent[parentId] = []
        }
        groups.depth2ByParent[parentId].push(cert)
      }
    }

    return groups
  }, [filteredResults])

  // The rows in the order they are drawn, so arrow keys walk them top to bottom.
  const orderedResults = useMemo(
    () => [
      ...groupedResults.depth0,
      ...Object.values(groupedResults.depth1ByParent).flat(),
      ...Object.values(groupedResults.depth2ByParent).flat(),
    ],
    [groupedResults]
  )
  const optionIndex = (cert: Certification) => orderedResults.indexOf(cert)

  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: isLoading ? 0 : orderedResults.length,
    open: showResults,
    onSelectIndex: (index) => {
      const cert = orderedResults[index]
      if (cert) handleSelect(cert)
    },
    onClose: () => setShowResults(false),
  })

  const rowStyle =
    (cert: Certification) =>
    ({ pressed }: { pressed: boolean }) => [
      getMenuItemStyle(t, { active: nav.activeIndex === optionIndex(cert), pressed }),
      { padding: 12, borderBottomWidth: 1, borderColor: colors.border[t].default },
    ]

  // Get parent title for grouping display
  const getParentTitle = (parentId: string | null): string => {
    if (!parentId) return 'Other'
    const cert = searchResults.find((c) => c.id === parentId)
    return cert?.title || 'Unknown Parent'
  }

  // Depth badge component
  const DepthBadge = ({ depth }: { depth: number }) => {
    const labels = ['Top Level', 'Category', 'Certification']
    const badgeColors = [
      colors.text[t].emphasis,
      t === 'dark' ? colors.green[300] : colors.green[600],
      t === 'dark' ? colors.purple[300] : colors.purple[600],
    ]
    const bgColor = badgeColors[depth] || colors.text[t].tertiary
    return (
      <Row
        style={{
          backgroundColor: bgColor,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: bgColor,
        }}
      >
        <Text style={{ color: colors.bg[t].default }}>{labels[depth] || `Depth ${depth}`}</Text>
      </Row>
    )
  }

  return (
    <Stack gap={8} style={{ position: 'relative' }}>
      <Text>Search Certifications</Text>
      <View ref={anchorRef}>
        <Input
          placeholder="Search certifications (e.g., OSHA, First Aid, Welding)"
          value={searchQuery}
          testID="cert-search-input"
          onChangeText={(text) => {
            setSearchQuery(text)
            if (text.length > 0) {
              setShowResults(true)
            } else {
              setShowResults(false)
            }
          }}
          onFocus={() => searchQuery.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          {...nav.inputProps}
        />
      </View>

      {/* Results menu — portalled above the page on web (#1330, #1334) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={showResults}
        onRequestClose={() => setShowResults(false)}
        maxHeight={400}
        testID="cert-search-results"
        {...nav.listboxProps}
      >
        {isLoading ? (
          <Stack padding="md" align="center" gap={8}>
            <Text style={{ color: colors.text[t].secondary }}>Searching...</Text>
          </Stack>
        ) : filteredResults.length === 0 ? (
          <Stack padding="md" align="center" gap={8}>
            {searchQuery.length > 0 ? (
              <>
                <Search size={32} color={colors.text[t].secondary} />
                <Text style={{ color: colors.text[t].secondary }}>No certifications found</Text>
                <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
                  Try a different search term
                </Text>
              </>
            ) : (
              <>
                <Search size={32} color={colors.text[t].secondary} />
                <Text style={{ color: colors.text[t].secondary }}>
                  Type to search certifications
                </Text>
                <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
                  Search for certifications like "OSHA" or "First Aid"
                </Text>
              </>
            )}
          </Stack>
        ) : (
          <Stack>
            {/* Depth 0 - Top Level */}
            {groupedResults.depth0.length > 0 && (
              <Stack>
                <Row
                  style={{
                    padding: 12,
                    backgroundColor: colors.bg[t].muted,
                    borderBottomWidth: 1,
                    borderColor: colors.border[t].default,
                  }}
                  align="center"
                  gap={8}
                  testID="cert-search-section-depth0"
                >
                  <Award size={24} color={colors.text[t].secondary} />
                  <Text style={{ color: colors.text[t].secondary }}>Top Level Categories</Text>
                </Row>
                {groupedResults.depth0.map((cert) => (
                  <Pressable
                    key={cert.id}
                    onPress={() => handleSelect(cert)}
                    {...nav.getOptionProps(optionIndex(cert))}
                    style={rowStyle(cert)}
                    testID="cert-search-card-0"
                  >
                    <Stack gap={8}>
                      <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                        <Text style={{ flex: 1 }}>{cert.title}</Text>
                        <DepthBadge depth={cert.depth} />
                      </Row>
                      {cert.description && (
                        <Text style={{ color: colors.text[t].secondary }}>{cert.description}</Text>
                      )}
                    </Stack>
                  </Pressable>
                ))}
              </Stack>
            )}

            {/* Depth 1 - Categories grouped by parent */}
            {Object.entries(groupedResults.depth1ByParent).map(([parentId, certs]) => (
              <Stack key={parentId}>
                <Row
                  style={{
                    padding: 12,
                    backgroundColor: colors.bg[t].muted,
                    borderBottomWidth: 1,
                    borderColor: colors.border[t].default,
                  }}
                  align="center"
                  gap={8}
                  testID="cert-search-section-depth1"
                >
                  <Award size={24} color={colors.text[t].secondary} />
                  <Text style={{ color: colors.text[t].secondary }}>
                    {parentId === 'none'
                      ? 'Categories'
                      : `${getParentTitle(parentId)} > Categories`}
                  </Text>
                </Row>
                {certs.map((cert) => (
                  <Pressable
                    key={cert.id}
                    onPress={() => handleSelect(cert)}
                    {...nav.getOptionProps(optionIndex(cert))}
                    style={rowStyle(cert)}
                    testID="cert-search-card-1"
                  >
                    <Stack gap={8}>
                      <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                        <Text style={{ flex: 1 }}>{cert.title}</Text>
                        <DepthBadge depth={cert.depth} />
                      </Row>
                      {cert.description && (
                        <Text style={{ color: colors.text[t].secondary }}>{cert.description}</Text>
                      )}
                    </Stack>
                  </Pressable>
                ))}
              </Stack>
            ))}

            {/* Depth 2 - Specific certifications grouped by parent */}
            {Object.entries(groupedResults.depth2ByParent).map(([parentId, certs]) => (
              <Stack key={parentId}>
                <Row
                  style={{
                    padding: 12,
                    backgroundColor: colors.bg[t].muted,
                    borderBottomWidth: 1,
                    borderColor: colors.border[t].default,
                  }}
                  align="center"
                  gap={8}
                  testID="cert-search-section-depth2"
                >
                  <Award size={24} color={colors.text[t].secondary} />
                  <Text style={{ color: colors.text[t].secondary }}>
                    {parentId === 'none'
                      ? 'Specific Certifications'
                      : `${getParentTitle(parentId)} > Certifications`}
                  </Text>
                </Row>
                {certs.map((cert) => {
                  // Build hierarchy path
                  const hierarchyPath = cert.parent_title
                    ? `${cert.parent_title} > ${cert.title}`
                    : cert.title

                  return (
                    <Pressable
                      key={cert.id}
                      onPress={() => handleSelect(cert)}
                      {...nav.getOptionProps(optionIndex(cert))}
                      style={rowStyle(cert)}
                      testID="cert-search-card-2"
                    >
                      <Stack gap={8}>
                        <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                          <Stack style={{ flex: 1 }} gap={4}>
                            <Text>{cert.title}</Text>
                            {cert.parent_title && (
                              <Text style={{ color: colors.text[t].secondary }}>
                                {hierarchyPath}
                              </Text>
                            )}
                          </Stack>
                          <DepthBadge depth={cert.depth} />
                        </Row>
                        {cert.description && (
                          <Text style={{ color: colors.text[t].secondary }}>
                            {cert.description}
                          </Text>
                        )}
                      </Stack>
                    </Pressable>
                  )
                })}
              </Stack>
            ))}
          </Stack>
        )}
      </AnchoredOverlay>
    </Stack>
  )
}
