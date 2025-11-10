import { ScrollView, Text, Input, Label, Button, XStack, Separator, YStack } from 'tamagui'
import { Search, Filter, X } from '@tamagui/lucide-icons'
import { FilterChip } from '@app/ui'
import { AddOrganizationWidget } from './components/AddOrganizationWidget'

interface DiscoverEmployersRightProps {
  searchQuery: string
  industries: string[]
  industryCounts: Record<string, number>
  selectedIndustries: string[]
  onSearchChange: (query: string) => void
  onIndustriesChange: (industries: string[]) => void
  onClearFilters: () => void
}

/**
 * Discover Employers Right Component
 * Right panel content for the employers discovery page - displays search and filters
 */
export function DiscoverEmployersRight({
  searchQuery,
  industries,
  industryCounts,
  selectedIndustries,
  onSearchChange,
  onIndustriesChange,
  onClearFilters,
}: DiscoverEmployersRightProps) {
  // Mock industries - fallback when API data is not yet available
  const fallbackIndustries = [
    'Construction',
    'Manufacturing',
    'Engineering',
    'Technology',
    'Healthcare',
    'Education',
  ]

  const industryOptions = industries.length > 0 ? industries : fallbackIndustries

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
  }

  const handleIndustryToggle = (industry: string) => {
    const nextIndustries = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry]

    onIndustriesChange(nextIndustries)
  }

  const handleClearFilters = () => {
    onClearFilters()
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
            {industryOptions.map((industry) => {
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
                <YStack gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Industries:
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {selectedIndustries.map((industry) => {
                      const count = industryCounts[industry] ?? 0
                      const isInteractive = count > 0

                      return (
                        <YStack
                          key={industry}
                          onPress={isInteractive ? () => handleIndustryToggle(industry) : undefined}
                          pointerEvents={isInteractive ? 'auto' : 'none'}
                          cursor={isInteractive ? 'pointer' : 'not-allowed'}
                          opacity={isInteractive ? 1 : 0.6}
                          hoverStyle={isInteractive ? { opacity: 0.9 } : undefined}
                          pressStyle={isInteractive ? { opacity: 0.85 } : undefined}
                          aria-disabled={!isInteractive}
                        >
                          <FilterChip
                            label={`${industry} (${count})`}
                            color={isInteractive ? 'blue' : 'gray'}
                            removable={false}
                          />
                        </YStack>
                      )
                    })}
                  </XStack>
                </YStack>
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  )
}
