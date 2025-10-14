import { useState, useEffect } from 'react'
import { Input, YStack, Text, ScrollView, Card } from 'tamagui'
import { Search } from '@tamagui/lucide-icons'

interface Certification {
  id: string
  slug: string
  title: string
  description: string | null
  depth: number
  sort_order: number
}

interface CertificationSearchProps {
  onSelect: (certification: Certification) => void
  searchResults: Certification[]
  onSearchChange: (query: string) => void
  isLoading?: boolean
  selectedIds?: string[]
}

/**
 * Search component for top-level certifications (depth 0)
 * Provides autocomplete-style search with debouncing
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

  return (
    <YStack gap="$2" position="relative">
      <Text fontWeight="600" fontSize="$4">
        Add Certification Category
      </Text>
      <Input
        placeholder="Search certifications (e.g., OSHA, First Aid, Welding)"
        value={searchQuery}
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
          height={300}
          overflow="hidden"
        >
          <ScrollView height={300}>
            {isLoading ? (
              <YStack p="$4">
                <Text color="$color11">Searching...</Text>
              </YStack>
            ) : filteredResults.length === 0 ? (
              <YStack p="$4">
                <Text color="$color11">
                  {searchQuery.length > 0
                    ? 'No certifications found'
                    : 'Type to search certifications'}
                </Text>
              </YStack>
            ) : (
              <YStack>
                {filteredResults.map((cert) => (
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
                  >
                    <YStack gap="$1">
                      <Text fontWeight="600">{cert.title}</Text>
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
          </ScrollView>
        </Card>
      )}
    </YStack>
  )
}
