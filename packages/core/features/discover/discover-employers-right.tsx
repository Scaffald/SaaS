import { useState } from 'react'
import { ScrollView, Text, Input, Label, Button, XStack, Separator, YStack } from 'tamagui'
import { Search, Filter, X } from '@tamagui/lucide-icons'
import { AddOrganizationWidget } from './components/AddOrganizationWidget'

interface DiscoverEmployersRightProps {
  onSearchChange: (query: string) => void
  onIndustriesChange: (industries: string[]) => void
}

/**
 * Discover Employers Right Component
 * Right panel content for the employers discovery page - displays search and filters
 */
export function DiscoverEmployersRight({
  onSearchChange,
  onIndustriesChange,
}: DiscoverEmployersRightProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  // Mock industries - in real app, fetch from API
  const industries = [
    'Construction',
    'Manufacturing',
    'Engineering',
    'Technology',
    'Healthcare',
    'Education',
  ]

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry]

    setSelectedIndustries(newIndustries)
    onIndustriesChange(newIndustries)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    onSearchChange('')
    onIndustriesChange([])
  }

  const hasActiveFilters = searchQuery.length > 0 || selectedIndustries.length > 0

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <AddOrganizationWidget />

        {/* Header */}
        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <Text fontSize="$6" fontWeight="700" color="$color12">
              Search & Filter
            </Text>
            {hasActiveFilters && (
              <Button size="$2" chromeless color="$red10" icon={X} onPress={handleClearFilters}>
                Clear
              </Button>
            )}
          </XStack>
          <Text fontSize="$3" color="$color11">
            Find employers that match your interests
          </Text>
        </YStack>

        <Separator />

        {/* Search */}
        <YStack gap="$2">
          <Label htmlFor="search" fontSize="$4" fontWeight="600" color="$color12">
            <Search size={16} style={{ marginRight: 8 }} />
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search employers..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            size="$4"
          />
        </YStack>

        <Separator />

        {/* Industry Filter */}
        <YStack gap="$3">
          <XStack items="center" gap="$2">
            <Filter size={16} color="$color12" />
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Industries
            </Text>
          </XStack>

          <YStack gap="$2">
            {industries.map((industry) => {
              const isSelected = selectedIndustries.includes(industry)
              return (
                <Button
                  key={industry}
                  size="$3"
                  theme={isSelected ? 'blue' : undefined}
                  variant="outlined"
                  onPress={() => handleIndustryToggle(industry)}
                >
                  {industry}
                </Button>
              )
            })}
          </YStack>
        </YStack>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <>
            <Separator />
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Active Filters
              </Text>
              {searchQuery && (
                <XStack gap="$2" items="center">
                  <Text fontSize="$3" color="$color11">
                    Search:
                  </Text>
                  <Text fontSize="$3" fontWeight="600" color="$blue10">
                    {searchQuery}
                  </Text>
                </XStack>
              )}
              {selectedIndustries.length > 0 && (
                <XStack gap="$2" items="center" flexWrap="wrap">
                  <Text fontSize="$3" color="$color11">
                    Industries:
                  </Text>
                  {selectedIndustries.map((industry) => (
                    <Text key={industry} fontSize="$3" fontWeight="600" color="$blue10">
                      {industry}
                    </Text>
                  ))}
                </XStack>
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  )
}
