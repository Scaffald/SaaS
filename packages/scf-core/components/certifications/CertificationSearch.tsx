import { Award, Search } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Card, Input, Text, Row, Stack } from '@scaffald/ui'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

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

  // Get parent title for grouping display
  const getParentTitle = (parentId: string | null): string => {
    if (!parentId) return 'Other'
    const cert = searchResults.find((c) => c.id === parentId)
    return cert?.title || 'Unknown Parent'
  }

  // Depth badge component
  const DepthBadge = ({ depth }: { depth: number }) => {
    const labels = ['Top Level', 'Category', 'Certification']
    const colors: Array<'$blue9' | '$green9' | '$purple9' | '$gray9'> = [
      '$blue9',
      '$green9',
      '$purple9',
    ]
    const bgColor = (colors[depth] || '$gray9') as '$blue9' | '$green9' | '$purple9' | '$gray9'
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
        <Text color="$background">{labels[depth] || `Depth ${depth}`}</Text>
      </Row>
    )
  }

  return (
    <Stack gap={8} style={{ position: 'relative' }}>
      <Text>Search Certifications</Text>
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
      />

      {showResults && (
        <Card
          style={{
            position: 'absolute',
            top: 48,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 400,
            overflow: 'hidden',
          }}
          elevation="lg"
          testID="cert-search-results"
        >
          <ScrollView style={{ height: 400 }}>
            {isLoading ? (
              <Stack padding="md" align="center" gap={8}>
                <Text color="gray">Searching...</Text>
              </Stack>
            ) : filteredResults.length === 0 ? (
              <Stack padding="md" align="center" gap={8}>
                {searchQuery.length > 0 ? (
                  <>
                    <Search size={32} color="gray" />
                    <Text color="gray">No certifications found</Text>
                    <Text color="gray" style={{ textAlign: 'center' }}>
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <Search size={32} color="gray" />
                    <Text color="gray">Type to search certifications</Text>
                    <Text color="gray" style={{ textAlign: 'center' }}>
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
                        backgroundColor: '$color3',
                        borderBottomWidth: 1,
                        borderColor: '$borderColor',
                      }}
                      align="center"
                      gap={8}
                      testID="cert-search-section-depth0"
                    >
                      <Award size="lg" color="gray" />
                      <Text color="gray">Top Level Categories</Text>
                    </Row>
                    {groupedResults.depth0.map((cert) => (
                      <Card
                        key={cert.id}
                        style={{
                          padding: 12,
                          borderRadius: 0,
                          borderWidth: 0,
                          borderBottomWidth: 1,
                          borderColor: '$borderColor',
                          cursor: 'pointer',
                        }}
                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                        onPress={() => handleSelect(cert)}
                        testID="cert-search-card-0"
                      >
                        <Stack gap={8}>
                          <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                            <Text style={{ flex: 1 }}>{cert.title}</Text>
                            <DepthBadge depth={cert.depth} />
                          </Row>
                          {cert.description && <Text color="gray">{cert.description}</Text>}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}

                {/* Depth 1 - Categories grouped by parent */}
                {Object.entries(groupedResults.depth1ByParent).map(([parentId, certs]) => (
                  <Stack key={parentId}>
                    <Row
                      style={{
                        padding: 12,
                        backgroundColor: '$color3',
                        borderBottomWidth: 1,
                        borderColor: '$borderColor',
                      }}
                      align="center"
                      gap={8}
                      testID="cert-search-section-depth1"
                    >
                      <Award size="lg" color="gray" />
                      <Text color="gray">
                        {parentId === 'none'
                          ? 'Categories'
                          : `${getParentTitle(parentId)} > Categories`}
                      </Text>
                    </Row>
                    {certs.map((cert) => (
                      <Card
                        key={cert.id}
                        style={{
                          padding: 12,
                          borderRadius: 0,
                          borderWidth: 0,
                          borderBottomWidth: 1,
                          borderColor: '$borderColor',
                          cursor: 'pointer',
                        }}
                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                        onPress={() => handleSelect(cert)}
                        testID="cert-search-card-1"
                      >
                        <Stack gap={8}>
                          <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                            <Text style={{ flex: 1 }}>{cert.title}</Text>
                            <DepthBadge depth={cert.depth} />
                          </Row>
                          {cert.description && <Text color="gray">{cert.description}</Text>}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ))}

                {/* Depth 2 - Specific certifications grouped by parent */}
                {Object.entries(groupedResults.depth2ByParent).map(([parentId, certs]) => (
                  <Stack key={parentId}>
                    <Row
                      style={{
                        padding: 12,
                        backgroundColor: '$color3',
                        borderBottomWidth: 1,
                        borderColor: '$borderColor',
                      }}
                      align="center"
                      gap={8}
                      testID="cert-search-section-depth2"
                    >
                      <Award size="lg" color="gray" />
                      <Text color="gray">
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
                        <Card
                          key={cert.id}
                          style={{
                            padding: 12,
                            borderRadius: 0,
                            borderWidth: 0,
                            borderBottomWidth: 1,
                            borderColor: '$borderColor',
                            cursor: 'pointer',
                          }}
                          pressStyle={{ backgroundColor: '$backgroundHover' }}
                          onPress={() => handleSelect(cert)}
                          testID="cert-search-card-2"
                        >
                          <Stack gap={8}>
                            <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
                              <Stack style={{ flex: 1 }} gap={4}>
                                <Text>{cert.title}</Text>
                                {cert.parent_title && <Text color="gray">{hierarchyPath}</Text>}
                              </Stack>
                              <DepthBadge depth={cert.depth} />
                            </Row>
                            {cert.description && <Text color="gray">{cert.description}</Text>}
                          </Stack>
                        </Card>
                      )
                    })}
                  </Stack>
                ))}
              </Stack>
            )}
          </ScrollView>
        </Card>
      )}
    </Stack>
  )
}
