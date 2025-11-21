import { Award, Search } from '@tamagui/lucide-icons'
import { useEffect, useMemo, useState } from 'react'
import { Card, Input, ScrollView, Text, XStack, YStack } from 'tamagui'

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
      <XStack bg={bgColor} px="$2" py="$0.5" rounded="$2" borderWidth={1} borderColor={bgColor}>
        <Text color="$background" fontSize="$1" fontWeight="600">
          {labels[depth] || `Depth ${depth}`}
        </Text>
      </XStack>
    )
  }

  return (
    <YStack gap="$2" position="relative">
      <Text fontWeight="600" fontSize="$4">
        Search Certifications
      </Text>
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
          position="absolute"
          top="$12"
          left={0}
          right={0}
          zIndex={1000}
          elevation="$4"
          height={400}
          overflow="hidden"
          testID="cert-search-results"
        >
          <ScrollView height={400}>
            {isLoading ? (
              <YStack p="$4" items="center" gap="$2">
                <Text color="$color11">Searching...</Text>
              </YStack>
            ) : filteredResults.length === 0 ? (
              <YStack p="$4" items="center" gap="$2">
                {searchQuery.length > 0 ? (
                  <>
                    <Search size={32} color="$color11" />
                    <Text color="$color11">No certifications found</Text>
                    <Text fontSize="$2" color="$color11" style={{ textAlign: 'center' }}>
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <Search size={32} color="$color11" />
                    <Text color="$color11">Type to search certifications</Text>
                    <Text fontSize="$2" color="$color11" style={{ textAlign: 'center' }}>
                      Search for certifications like "OSHA" or "First Aid"
                    </Text>
                  </>
                )}
              </YStack>
            ) : (
              <YStack>
                {/* Depth 0 - Top Level */}
                {groupedResults.depth0.length > 0 && (
                  <YStack>
                    <XStack
                      p="$3"
                      bg="$color3"
                      borderBottomWidth={1}
                      borderColor="$borderColor"
                      items="center"
                      gap="$2"
                      testID="cert-search-section-depth0"
                    >
                      <Award size={16} color="$color10" />
                      <Text fontWeight="600" fontSize="$3" color="$color11">
                        Top Level Categories
                      </Text>
                    </XStack>
                    {groupedResults.depth0.map((cert) => (
                      <Card
                        key={cert.id}
                        p="$3"
                        borderRadius={0}
                        borderWidth={0}
                        borderBottomWidth={1}
                        borderColor="$borderColor"
                        pressStyle={{ bg: '$backgroundHover' }}
                        cursor="pointer"
                        onPress={() => handleSelect(cert)}
                        testID="cert-search-card-0"
                      >
                        <YStack gap="$2">
                          <XStack gap="$2" items="center" flexWrap="wrap">
                            <Text fontWeight="600" flex={1}>
                              {cert.title}
                            </Text>
                            <DepthBadge depth={cert.depth} />
                          </XStack>
                          {cert.description && (
                            <Text fontSize="$2" color="$color11" numberOfLines={2}>
                              {cert.description}
                            </Text>
                          )}
                        </YStack>
                      </Card>
                    ))}
                  </YStack>
                )}

                {/* Depth 1 - Categories grouped by parent */}
                {Object.entries(groupedResults.depth1ByParent).map(([parentId, certs]) => (
                  <YStack key={parentId}>
                    <XStack
                      p="$3"
                      bg="$color3"
                      borderBottomWidth={1}
                      borderColor="$borderColor"
                      items="center"
                      gap="$2"
                      testID="cert-search-section-depth1"
                    >
                      <Award size={16} color="$color10" />
                      <Text fontWeight="600" fontSize="$3" color="$color11">
                        {parentId === 'none'
                          ? 'Categories'
                          : `${getParentTitle(parentId)} > Categories`}
                      </Text>
                    </XStack>
                    {certs.map((cert) => (
                      <Card
                        key={cert.id}
                        p="$3"
                        borderRadius={0}
                        borderWidth={0}
                        borderBottomWidth={1}
                        borderColor="$borderColor"
                        pressStyle={{ bg: '$backgroundHover' }}
                        cursor="pointer"
                        onPress={() => handleSelect(cert)}
                        testID="cert-search-card-1"
                      >
                        <YStack gap="$2">
                          <XStack gap="$2" items="center" flexWrap="wrap">
                            <Text fontWeight="600" flex={1}>
                              {cert.title}
                            </Text>
                            <DepthBadge depth={cert.depth} />
                          </XStack>
                          {cert.description && (
                            <Text fontSize="$2" color="$color11" numberOfLines={2}>
                              {cert.description}
                            </Text>
                          )}
                        </YStack>
                      </Card>
                    ))}
                  </YStack>
                ))}

                {/* Depth 2 - Specific certifications grouped by parent */}
                {Object.entries(groupedResults.depth2ByParent).map(([parentId, certs]) => (
                  <YStack key={parentId}>
                    <XStack
                      p="$3"
                      bg="$color3"
                      borderBottomWidth={1}
                      borderColor="$borderColor"
                      items="center"
                      gap="$2"
                      testID="cert-search-section-depth2"
                    >
                      <Award size={16} color="$color10" />
                      <Text fontWeight="600" fontSize="$3" color="$color11">
                        {parentId === 'none'
                          ? 'Specific Certifications'
                          : `${getParentTitle(parentId)} > Certifications`}
                      </Text>
                    </XStack>
                    {certs.map((cert) => {
                      // Build hierarchy path
                      const hierarchyPath = cert.parent_title
                        ? `${cert.parent_title} > ${cert.title}`
                        : cert.title

                      return (
                        <Card
                          key={cert.id}
                          p="$3"
                          borderRadius={0}
                          borderWidth={0}
                          borderBottomWidth={1}
                          borderColor="$borderColor"
                          pressStyle={{ bg: '$backgroundHover' }}
                          cursor="pointer"
                          onPress={() => handleSelect(cert)}
                          testID="cert-search-card-2"
                        >
                          <YStack gap="$2">
                            <XStack gap="$2" items="center" flexWrap="wrap">
                              <YStack flex={1} gap="$1">
                                <Text fontWeight="600">{cert.title}</Text>
                                {cert.parent_title && (
                                  <Text fontSize="$2" color="$color10">
                                    {hierarchyPath}
                                  </Text>
                                )}
                              </YStack>
                              <DepthBadge depth={cert.depth} />
                            </XStack>
                            {cert.description && (
                              <Text fontSize="$2" color="$color11" numberOfLines={2}>
                                {cert.description}
                              </Text>
                            )}
                          </YStack>
                        </Card>
                      )
                    })}
                  </YStack>
                ))}
              </YStack>
            )}
          </ScrollView>
        </Card>
      )}
    </YStack>
  )
}
